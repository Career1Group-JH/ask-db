# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
