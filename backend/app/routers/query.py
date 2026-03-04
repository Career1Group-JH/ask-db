from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.config import get_settings
from app.db import execute_query
from app.services.llm import generate_sql
from app.services.schema import load_schema
from app.services.validator import SQLValidationError, validate_sql

router = APIRouter()


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


class QueryResponse(BaseModel):
    question: str
    reasoning: str
    sql: str
    columns: list[str]
    rows: list[list[Any]]
    row_count: int
    steps: list[dict[str, Any]]


@router.post("/query", response_model=QueryResponse)
async def query(request: Request, body: QueryRequest):
    settings = get_settings()
    pool = request.app.state.pool

    schema_text = await load_schema(pool, settings.db_name)

    async def run_exploration(sql: str):
        return await execute_query(pool, sql)

    try:
        llm_result = await generate_sql(
            question=body.question,
            schema_text=schema_text,
            model=settings.llm_model,
            api_key=settings.llm_api_key,
            execute_fn=run_exploration,
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

    return QueryResponse(
        question=body.question,
        reasoning=reasoning,
        sql=validated_sql,
        columns=columns,
        rows=rows,
        row_count=len(rows),
        steps=steps,
    )
