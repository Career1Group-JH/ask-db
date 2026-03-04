# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

### [0.3.0] - 2026-03-04

#### Added

- Natural-language answer generation — LLM interprets SQL results and returns a human-readable `answer` field alongside raw data
- Recruiting & TalentHub domain vocabulary (workMode, employmentType, isTalentHubRegistered, jobPortalProfileStatus)
- Central `VERSION` file as single source of truth; FastAPI discovers it by walking up the directory tree (works in both local dev and Docker)

#### Changed

- Exploration queries now validated through `validate_sql` before execution — prevents injection via crafted LLM output
- SQL validator: extended forbidden keywords with `SLEEP`, `BENCHMARK`, `LOAD_FILE`, `INTO OUTFILE`, `INTO DUMPFILE`
- Docker Compose: mounts `VERSION` file into backend container

### [0.2.0] - 2026-03-04

#### Added

- Context extraction script (`backend/scripts/extract_context.py`) — parses PHP enums and model column mappings from a source codebase to auto-generate business context
- Expanded business context YAML with 12 new enum sections: termination types, abort/revocation reasons, business segments, companion roles, presences, BGS/WV workflows, job tracking, internal exams, and deals_modules details

#### Changed

- Python 3.12 → 3.13, FastAPI pinned to >=0.135.0
- Response structure: `steps` array now contains only exploration steps; final answer lives exclusively in top-level `reasoning`/`sql` (removes redundancy)
- `AGENTS.md`: added post-PoC refactoring notes for context extraction (GitHub hook / submodule)

### [0.1.1] - 2026-03-04

#### Added

- Current date injection in system prompt — LLM correctly resolves relative dates ("bis März", "letzter Monat")

#### Changed

- `db/README.md`: made product-agnostic — references `DB_NAME` from `.env` instead of hardcoded database names

### [0.1.0] - 2026-03-04

#### Added

- Project setup: monorepo with `backend/`, `frontend/`, `db/` structure
- Docker Compose: MariaDB 11 + FastAPI backend as separate containers with healthchecks
- FastAPI backend: `/query` endpoint — natural language → SQL → JSON result
- Schema loader: reads tables, columns, types, and foreign keys live from `INFORMATION_SCHEMA`
- Business context: YAML-based domain knowledge injection (tenants, deal statuses, education types, participant fields, absences)
- LLM integration: `litellm` for provider-agnostic calls (Gemini 3.1 Pro Preview), structured output via JSON schema
- Multi-step agent: LLM can run up to 5 exploration rounds before writing final SQL — discovers slugs, values, and relationships dynamically
- SQL validator: allows only SELECT, enforces LIMIT, blocks destructive statements
- Verification prompting: LLM is encouraged to verify assumptions before answering
- Swagger UI: interactive examples for the `/query` endpoint
- `AGENTS.md` for AI agent context
