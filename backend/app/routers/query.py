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


class SanityCheck(BaseModel):
    description: str
    value: int
    ratio: str


class QueryResponse(BaseModel):
    question: str
    reasoning: str
    sql: str
    columns: list[str]
    rows: list[list[Any]]
    row_count: int
    sanity: SanityCheck | None = None
    steps: list[dict[str, Any]]


async def _run_sanity_check(
    pool, sanity_query: str, sanity_description: str, row_count: int
) -> SanityCheck | None:
    """Execute the LLM-provided sanity query and build a context object."""
    if not sanity_query or not sanity_description:
        return None

    sanity_query = sanity_query.strip().rstrip(";")
    if not sanity_query.upper().startswith("SELECT"):
        return None

    try:
        _, rows = await execute_query(pool, sanity_query)
        value = rows[0][0] if rows else None
        if value is None or not isinstance(value, (int, float)):
            return None

        return SanityCheck(
            description=sanity_description,
            value=int(value),
            ratio=f"{row_count} von {int(value)}",
        )
    except Exception:
        return None


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

    row_count = len(rows)
    sanity = await _run_sanity_check(
        pool,
        llm_result.get("sanity_query", ""),
        llm_result.get("sanity_description", ""),
        row_count,
    )

    return QueryResponse(
        question=body.question,
        reasoning=reasoning,
        sql=validated_sql,
        columns=columns,
        rows=rows,
        row_count=row_count,
        sanity=sanity,
        steps=steps,
    )
