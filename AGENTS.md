# AskDB — Agent Context

## What is this project?

Internal tool that converts natural language questions into SQL queries against a MariaDB database. Users type a question (e.g. "Alle aktiven Teilnehmer in Kurs Klassisches PM für OC"), the LLM generates SQL, the SQL runs against the DB, and results come back as a table.

## Tech Stack

- **Backend**: FastAPI (Python 3.13), async throughout
- **LLM**: litellm (provider-agnostic — OpenAI, Anthropic, etc. via `LLM_MODEL` env var)
- **Database**: MariaDB 11 (local prod dump for PoC)
- **DB Driver**: aiomysql (async connection pool)
- **Config**: pydantic-settings with `.env` file
- **Containers**: Docker Compose (backend + db + frontend services)
- **Frontend**: Vite + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Data Fetching**: TanStack Query v5 (`useMutation` for POST requests)
- **Persistence**: localStorage for conversation history (PoC phase)

## Architecture

```
POST /query { "question": "...", "history": [...], "history_summary": "..." }
  → Load DB schema from INFORMATION_SCHEMA (columns, types, foreign keys — cached)
  → Build system prompt: schema + business context YAML
  → Inject conversation context (summary + recent history)
  → Multi-step LLM agent (up to 5 rounds):
      explore → run discovery queries → explore more or answer
  → Validate final SQL (SELECT only, enforce LIMIT)
  → Execute SQL against MariaDB
  → Return { sql, reasoning, answer, columns, rows, row_count, steps }

POST /summarize { "messages": [...], "existing_summary": "..." }
  → LLM condenses older conversation messages into compact summary
  → Return { summary }
```

## Project Structure

```
ask-db/
├── backend/app/          # FastAPI application
│   ├── main.py           # App entry, CORS, lifespan
│   ├── config.py         # Settings (pydantic-settings)
│   ├── db.py             # aiomysql connection pool
│   ├── routers/query.py  # POST /query + POST /summarize endpoints
│   ├── services/
│   │   ├── schema.py     # INFORMATION_SCHEMA reader
│   │   ├── llm.py        # LLM integration (litellm) — generate_sql, interpret_results, summarize_history
│   │   └── validator.py  # SQL validation
│   └── context/
│       ├── clientoffice.yaml           # Manual business domain context
│       └── clientoffice.generated.yaml # Auto-extracted enums (from PHP codebase)
├── frontend/src/         # React application (Atomic Design)
│   ├── components/
│   │   ├── ui/           # shadcn/ui primitives (auto-generated)
│   │   ├── atoms/        # Spinner, ThemeToggle
│   │   ├── molecules/    # ChatInput, SqlBlock, ResultTable
│   │   ├── organisms/    # ChatMessage, ChatMessages, AppSidebar
│   │   └── templates/    # ChatLayout
│   ├── hooks/            # useConversations, useQueryMutation
│   ├── lib/              # api.ts, storage.ts, constants.ts, utils.ts
│   └── types/            # TypeScript interfaces
├── db/dumps/             # SQL dump files (gitignored)
└── docker-compose.yml    # Backend + MariaDB + Frontend services
```

## Conventions

- Python: async/await everywhere, no sync DB calls
- Frontend: Atomic Design (atoms → molecules → organisms → templates), no inline styles, Tailwind-only
- Config: all secrets and environment-specific values in `.env`, never hardcoded
- SQL validation: only SELECT statements allowed, LIMIT enforced
- Business context: maintained in YAML files under `backend/app/context/`
- Context extraction: `backend/scripts/extract_context.py` parses PHP enums + models from the source codebase to generate enum/column mappings. Output is committed as `clientoffice.generated.yaml` — manual context stays in `clientoffice.yaml`.
- Chat memory: sliding window (last 5 messages verbatim) + LLM-generated summary for older messages
- Versioning: central `VERSION` file is single source of truth. After bumping, run `pnpm run sync-version` in `frontend/` to update `package.json`. This is required before every commit that changes the version.
- No testing, linting, or auth in PoC phase

## Domain Knowledge (ClientOffice)

All domain-specific context (tenants, deal statuses, education types, participant fields, etc.) lives in `backend/app/context/clientoffice.yaml` — that is the single source of truth. Do not duplicate domain details here.
