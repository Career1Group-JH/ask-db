from typing import Any

import aiomysql

_schema_cache: str | None = None

COLUMNS_QUERY = """
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_KEY,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = %s
ORDER BY TABLE_NAME, ORDINAL_POSITION
"""

FOREIGN_KEYS_QUERY = """
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = %s
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME
"""


async def load_schema(pool: aiomysql.Pool, db_name: str) -> str:
    """Load DB schema + foreign keys from INFORMATION_SCHEMA. Returns formatted text."""
    global _schema_cache
    if _schema_cache is not None:
        return _schema_cache

    schema: dict[str, list[dict[str, Any]]] = {}
    fk_map: dict[str, list[dict[str, str]]] = {}

    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(COLUMNS_QUERY, (db_name,))
            for table, column, col_type, nullable, key, comment in await cur.fetchall():
                if table not in schema:
                    schema[table] = []
                schema[table].append(
                    {
                        "column": column,
                        "type": col_type,
                        "nullable": nullable,
                        "key": key,
                        "comment": comment,
                    }
                )

            await cur.execute(FOREIGN_KEYS_QUERY, (db_name,))
            for table, column, ref_table, ref_column in await cur.fetchall():
                if table not in fk_map:
                    fk_map[table] = []
                fk_map[table].append(
                    {
                        "column": column,
                        "ref_table": ref_table,
                        "ref_column": ref_column,
                    }
                )

    _schema_cache = _format_schema(schema, fk_map)
    return _schema_cache


def _format_schema(
    schema: dict[str, list[dict[str, Any]]],
    fk_map: dict[str, list[dict[str, str]]],
) -> str:
    lines: list[str] = []
    for table, columns in sorted(schema.items()):
        lines.append(f"Table: {table}")
        for col in columns:
            parts = [f"  - {col['column']} ({col['type']})"]
            if col["key"] == "PRI":
                parts.append("PRIMARY KEY")
            elif col["key"] == "MUL":
                parts.append("INDEX")
            elif col["key"] == "UNI":
                parts.append("UNIQUE")
            if col["nullable"] == "NO":
                parts.append("NOT NULL")
            if col["comment"]:
                parts.append(f'-- {col["comment"]}')
            lines.append(" ".join(parts))

        if table in fk_map:
            lines.append("  Foreign Keys:")
            for fk in fk_map[table]:
                lines.append(
                    f"    {fk['column']} → {fk['ref_table']}.{fk['ref_column']}"
                )

        lines.append("")
    return "\n".join(lines)


def clear_cache() -> None:
    global _schema_cache
    _schema_cache = None
