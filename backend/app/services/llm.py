import json
import os
from pathlib import Path
from typing import Any

import yaml
from litellm import acompletion

CONTEXT_DIR = Path(__file__).parent.parent / "context"

MAX_EXPLORATION_STEPS = 5
EXPLORATION_ROW_LIMIT = 50

STEP_RESPONSE_SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "step_response",
        "schema": {
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ["explore", "answer"],
                    "description": "Whether to run exploration queries first or provide the final SQL answer",
                },
                "reasoning": {
                    "type": "string",
                    "description": "Step-by-step explanation of your thought process",
                },
                "exploration_queries": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "SELECT queries to explore the data (only when action=explore, max 3)",
                },
                "sql": {
                    "type": "string",
                    "description": "The final SQL SELECT statement (only when action=answer)",
                },
            },
            "required": ["action", "reasoning"],
            "additionalProperties": False,
        },
    },
}


def _load_business_context(product: str = "clientoffice") -> dict[str, Any]:
    path = CONTEXT_DIR / f"{product}.yaml"
    with open(path) as f:
        return yaml.safe_load(f)


def _build_context_section(ctx: dict[str, Any]) -> str:
    lines: list[str] = []
    lines.append(f"Product: {ctx['product']}")
    lines.append(f"Description: {ctx['description'].strip()}")
    lines.append("")

    for key, value in ctx.get("domain_vocabulary", {}).items():
        label = key.replace("_", " ").title()
        if isinstance(value, dict):
            lines.append(f"{label}:")
            for k, v in value.items():
                lines.append(f"  - {k} = {v}")
        elif isinstance(value, str):
            lines.append(f"{label}: {value.strip()}")
        else:
            lines.append(f"{label}: {value}")
        lines.append("")

    return "\n".join(lines)


def build_system_prompt(schema_text: str, product: str = "clientoffice") -> str:
    ctx = _load_business_context(product)
    context_section = _build_context_section(ctx)

    today = __import__('datetime').date.today().isoformat()

    return f"""You are a SQL expert for a MariaDB database. You convert natural language questions into correct SQL SELECT queries.

TODAY'S DATE: {today}
When users mention relative dates ("bis März", "letzter Monat", "dieses Jahr"), always resolve them relative to today's date.

You work in multiple steps: first you EXPLORE the data to understand it, then you write the final query.

WORKFLOW:
1. Read the user's question and the schema.
2. Decide: do you need to explore the data first, or can you answer directly?
   - For simple aggregates (COUNT, etc.) or trivial queries: action="answer" directly.
   - For queries involving specific values (course names, statuses, types, categories): action="explore" first.
3. If exploring: provide up to 3 small SELECT queries to discover actual data values, column meanings, or relationships. Each exploration query is automatically limited to {EXPLORATION_ROW_LIMIT} rows.
4. You can explore MULTIPLE TIMES (up to {MAX_EXPLORATION_STEPS} rounds). Use extra rounds when needed.
5. After enough exploration: write the final SQL with action="answer".

VERIFICATION — VERY IMPORTANT:
Before answering, ask yourself: "Am I confident the result will be correct?"
If NOT, do one more exploration round to VERIFY your assumptions:
- Run a quick COUNT(*) with your planned filters to check if the number looks plausible.
- If you plan to JOIN through multiple tables, test the JOIN on a small sample first: SELECT ... LIMIT 5
- If you found slugs/names in exploration, double-check they match the user's intent.
Only answer when you are confident the query is correct. Use your exploration budget wisely.

EXPLORATION TIPS:
- To find exact slugs/names: SELECT DISTINCT name, title FROM educations WHERE type = 1 AND (name LIKE '%projektmanagement%' OR title LIKE '%Projektmanagement%')
- To understand column values: SELECT DISTINCT status, COUNT(*) FROM deals GROUP BY status
- To check relationships: SELECT DISTINCT dm.course_id, e.name FROM deals_modules dm JOIN educations e ON dm.course_id = e.id LIMIT 20
- To verify before answering: SELECT COUNT(DISTINCT d.participants_id) FROM deals d WHERE d.tenant_id = 2 AND d.status = 1

CRITICAL RULE FOR FINAL SQL:
- After exploration, use EXACT values you discovered (e.g. e.name IN ('klassisches-projektmanagement', 'agiles-projektmanagement')). Do NOT fall back to LIKE patterns when you have the exact values from exploration.
- Only use LIKE if exploration did not reveal exact values.

RULES FOR FINAL SQL:
- Only SELECT statements. Never INSERT, UPDATE, DELETE, DROP, ALTER.
- Always add LIMIT 1000 unless the user asks for a different limit or it's an aggregate.
- Use the exact table and column names from the schema.
- Use Foreign Keys from the schema for JOIN paths. Do NOT guess relationships.
- Use DISTINCT when JOINs could produce duplicate rows.
- Always qualify column names with table aliases.

DATABASE SCHEMA (columns, types, keys, foreign keys):
{schema_text}

BUSINESS CONTEXT:
{context_section}"""


def _set_api_keys(api_key: str) -> None:
    os.environ["GEMINI_API_KEY"] = api_key
    os.environ["OPENAI_API_KEY"] = api_key
    os.environ["ANTHROPIC_API_KEY"] = api_key


async def _call_llm(
    messages: list[dict[str, str]],
    model: str,
    api_key: str,
) -> dict[str, Any]:
    _set_api_keys(api_key)
    response = await acompletion(
        model=model,
        messages=messages,
        response_format=STEP_RESPONSE_SCHEMA,
        api_key=api_key,
    )
    return json.loads(response.choices[0].message.content)


def _format_exploration_results(
    queries: list[str], results: list[tuple[list[str], list[list[Any]]]]
) -> str:
    lines: list[str] = []
    for query, (columns, rows) in zip(queries, results):
        lines.append(f"Query: {query}")
        if not columns:
            lines.append("  (no results)")
        else:
            lines.append(f"  Columns: {', '.join(columns)}")
            for row in rows[:EXPLORATION_ROW_LIMIT]:
                lines.append(f"  {row}")
            if len(rows) > EXPLORATION_ROW_LIMIT:
                lines.append(f"  ... ({len(rows)} rows total, showing first {EXPLORATION_ROW_LIMIT})")
        lines.append("")
    return "\n".join(lines)


async def generate_sql(
    question: str,
    schema_text: str,
    model: str,
    api_key: str,
    execute_fn=None,
    product: str = "clientoffice",
) -> dict[str, Any]:
    """Multi-step SQL generation. Returns {reasoning, sql, steps}."""
    system_prompt = build_system_prompt(schema_text, product)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": question},
    ]

    all_steps: list[dict[str, Any]] = []

    for step in range(MAX_EXPLORATION_STEPS + 1):
        result = await _call_llm(messages, model, api_key)

        if result["action"] == "answer" or step == MAX_EXPLORATION_STEPS:
            return {
                "reasoning": result.get("reasoning", ""),
                "sql": result.get("sql", ""),
                "steps": all_steps,
            }

        all_steps.append(result)

        exploration_queries = result.get("exploration_queries", [])
        if not exploration_queries or execute_fn is None:
            return {
                "reasoning": result.get("reasoning", ""),
                "sql": result.get("sql", ""),
                "steps": all_steps,
            }

        exploration_results = []
        for eq in exploration_queries[:3]:
            eq_limited = eq.strip().rstrip(";")
            if "LIMIT" not in eq_limited.upper():
                eq_limited += f" LIMIT {EXPLORATION_ROW_LIMIT}"
            try:
                cols, rows = await execute_fn(eq_limited)
                exploration_results.append((cols, rows))
            except Exception as e:
                exploration_results.append((["error"], [[str(e)]]))

        formatted = _format_exploration_results(exploration_queries, exploration_results)

        messages.append({"role": "assistant", "content": json.dumps(result)})
        remaining = MAX_EXPLORATION_STEPS - step
        messages.append({
            "role": "user",
            "content": (
                f"Here are the exploration results:\n\n{formatted}\n\n"
                f"You have {remaining} exploration rounds left. "
                "If you are confident, answer with action='answer'. "
                "If you need to verify or explore further, use action='explore'."
            ),
        })

    return {
        "reasoning": "Max exploration steps reached",
        "sql": "",
        "steps": all_steps,
    }
