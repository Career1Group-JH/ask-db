from typing import Any

import aiomysql

from app.config import Settings


async def create_pool(settings: Settings) -> aiomysql.Pool:
    return await aiomysql.create_pool(
        host=settings.db_host,
        port=settings.db_port,
        user=settings.db_user,
        password=settings.db_password,
        db=settings.db_name,
        minsize=1,
        maxsize=10,
        autocommit=True,
    )


async def close_pool(pool: aiomysql.Pool) -> None:
    pool.close()
    await pool.wait_closed()


async def execute_query(
    pool: aiomysql.Pool, sql: str
) -> tuple[list[str], list[list[Any]]]:
    """Execute a SQL query and return (columns, rows)."""
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(sql)
            columns = [desc[0] for desc in cur.description] if cur.description else []
            rows = await cur.fetchall()
            return columns, [list(row) for row in rows]
