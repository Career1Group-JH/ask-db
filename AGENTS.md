# AskDB — Agent Context

## What is this project?

Internal tool that converts natural language questions into SQL queries against a MariaDB database. Users type a question (e.g. "Alle aktiven Teilnehmer in Kurs Klassisches PM für OC"), the LLM generates SQL, the SQL runs against the DB, and results come back as a table.

## Tech Stack

- **Backend**: FastAPI (Python 3.12), async throughout
- **LLM**: litellm (provider-agnostic — OpenAI, Anthropic, etc. via `LLM_MODEL` env var)
- **Database**: MariaDB 11 (local prod dump for PoC)
- **DB Driver**: aiomysql (async connection pool)
- **Config**: pydantic-settings with `.env` file
- **Containers**: Docker Compose (backend + db services)
- **Frontend**: Vite + React + TypeScript + shadcn/ui (not yet implemented)

## Architecture

```
POST /query { "question": "..." }
  → Load DB schema from INFORMATION_SCHEMA (columns, types, foreign keys — cached)
  → Build system prompt: schema + business context YAML
  → Multi-step LLM agent (up to 5 rounds):
      explore → run discovery queries → explore more or answer
  → Validate final SQL (SELECT only, enforce LIMIT)
  → Execute SQL against MariaDB
  → Run LLM-generated sanity check query for plausibility context
  → Return { sql, reasoning, columns, rows, row_count, sanity, steps }
```

## Project Structure

```
ask-db/
├── backend/app/          # FastAPI application
│   ├── main.py           # App entry, CORS, lifespan
│   ├── config.py         # Settings (pydantic-settings)
│   ├── db.py             # aiomysql connection pool
│   ├── routers/query.py  # POST /query endpoint
│   ├── services/
│   │   ├── schema.py     # INFORMATION_SCHEMA reader
│   │   ├── llm.py        # LLM integration (litellm)
│   │   └── validator.py  # SQL validation
│   └── context/
│       └── clientoffice.yaml  # Business domain context
├── db/dumps/             # SQL dump files (gitignored)
├── frontend/             # React app (not yet implemented)
└── docker-compose.yml    # Backend + MariaDB services
```

## Conventions

- Python: async/await everywhere, no sync DB calls
- Config: all secrets and environment-specific values in `.env`, never hardcoded
- SQL validation: only SELECT statements allowed, LIMIT enforced
- Business context: maintained in YAML files under `backend/app/context/`
- No testing, linting, or auth in PoC phase

## Domain Knowledge (ClientOffice)

All domain-specific context (tenants, deal statuses, education types, participant fields, etc.) lives in `backend/app/context/clientoffice.yaml` — that is the single source of truth. Do not duplicate domain details here.
