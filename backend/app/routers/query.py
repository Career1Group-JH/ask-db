from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.config import get_settings
from app.db import execute_query
from app.services.llm import generate_sql, interpret_results, summarize_history
from app.services.schema import load_schema
from app.services.validator import SQLValidationError, validate_sql

router = APIRouter()


class HistoryEntry(BaseModel):
    question: str
    answer: str
    sql: str


class QueryRequest(BaseModel):
    model_config = {
        "json_schema_extra": {
            "examples": [
                {"question": "Wie viele aktive Teilnehmer hat OC?"},
                {"question": "Liste aller Teilnehmer im Kurs Agiles Projektmanagement für CN"},
                {"question": "Welche Kurse haben die meisten aktiven Teilnehmer? Top 10"},
            ]
        }
    }

    question: str = Field(
        description="Frage in natürlicher Sprache — einfach so fragen wie du einen Kollegen fragen würdest.",
    )
    history: list[HistoryEntry] = Field(
        default=[],
        description="Recent conversation history (sliding window of last N messages).",
    )
    history_summary: str = Field(
        default="",
        description="LLM-generated summary of older conversation messages beyond the sliding window.",
    )


class QueryResponse(BaseModel):
    question: str
    answer: str
    reasoning: str
    sql: str
    columns: list[str]
    rows: list[list[Any]]
    row_count: int
    steps: list[dict[str, Any]]


class SummarizeRequest(BaseModel):
    messages: list[HistoryEntry]
    existing_summary: str = ""


class SummarizeResponse(BaseModel):
    summary: str


@router.post("/query", response_model=QueryResponse)
async def query(request: Request, body: QueryRequest):
    settings = get_settings()
    pool = request.app.state.pool

    schema_text = await load_schema(pool, settings.db_name)

    async def run_exploration(sql: str):
        return await execute_query(pool, sql)

    history_dicts = [entry.model_dump() for entry in body.history]

    try:
        llm_result = await generate_sql(
            question=body.question,
            schema_text=schema_text,
            model=settings.llm_model,
            api_key=settings.llm_api_key,
            execute_fn=run_exploration,
            history=history_dicts,
            history_summary=body.history_summary,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {e}")

    raw_sql = llm_result.get("sql", "")
    reasoning = llm_result.get("reasoning", "")
    steps = llm_result.get("steps", [])

    if not raw_sql:
        raise HTTPException(
            status_code=422,
            detail={"error": "LLM did not produce a final SQL query", "reasoning": reasoning, "steps": steps},
        )

    try:
        validated_sql = validate_sql(raw_sql)
    except SQLValidationError as e:
        raise HTTPException(
            status_code=422,
            detail={"error": str(e), "sql": raw_sql, "reasoning": reasoning, "steps": steps},
        )

    try:
        columns, rows = await execute_query(pool, validated_sql)
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail={"error": f"SQL execution error: {e}", "sql": validated_sql, "reasoning": reasoning, "steps": steps},
        )

    try:
        answer = await interpret_results(
            question=body.question,
            sql=validated_sql,
            columns=columns,
            rows=rows,
            model=settings.llm_model,
            api_key=settings.llm_api_key,
            history_summary=body.history_summary,
        )
    except Exception:
        answer = ""

    numbered_columns = ["#"] + columns
    numbered_rows = [[i + 1] + row for i, row in enumerate(rows)]

    return QueryResponse(
        question=body.question,
        answer=answer,
        reasoning=reasoning,
        sql=validated_sql,
        columns=numbered_columns,
        rows=numbered_rows,
        row_count=len(rows),
        steps=steps,
    )


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize(body: SummarizeRequest):
    settings = get_settings()

    message_dicts = [entry.model_dump() for entry in body.messages]

    try:
        summary = await summarize_history(
            messages=message_dicts,
            existing_summary=body.existing_summary,
            model=settings.llm_model,
            api_key=settings.llm_api_key,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Summarization error: {e}")

    return SummarizeResponse(summary=summary)
