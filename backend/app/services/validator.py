import re

FORBIDDEN_KEYWORDS = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|REPLACE|GRANT|REVOKE|CALL"
    r"|SLEEP|BENCHMARK|LOAD_FILE|INTO\s+OUTFILE|INTO\s+DUMPFILE)\b",
    re.IGNORECASE,
)

SAFETY_LIMIT = 100_000

BLACKLISTED_TABLES = re.compile(
    r"\busers\b", re.IGNORECASE
)

AGGREGATE_FUNCTIONS = re.compile(
    r"\b(COUNT|SUM|AVG|MIN|MAX)\s*\(", re.IGNORECASE
)


class SQLValidationError(Exception):
    pass


def validate_sql(sql: str) -> str:
    """Validate and sanitize a SQL statement. Returns the (possibly modified) SQL."""
    cleaned = sql.strip().rstrip(";")

    if not cleaned.upper().startswith("SELECT"):
        raise SQLValidationError("Only SELECT statements are allowed.")

    if FORBIDDEN_KEYWORDS.search(cleaned):
        raise SQLValidationError(
            "Statement contains forbidden keywords (INSERT, UPDATE, DELETE, DROP, etc.)."
        )

    if BLACKLISTED_TABLES.search(cleaned):
        raise SQLValidationError(
            "Access to the 'users' table is not allowed."
        )

    if not re.search(r"\bLIMIT\b", cleaned, re.IGNORECASE):
        if not AGGREGATE_FUNCTIONS.search(cleaned):
            cleaned = f"{cleaned}\nLIMIT {SAFETY_LIMIT}"

    return cleaned
