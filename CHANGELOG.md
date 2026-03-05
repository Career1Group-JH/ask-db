# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

### [0.7.1] - 2026-03-05

#### Changed

- **SQL validator**: Blacklisted `users` table — queries referencing it are now rejected with a clear error message

### [0.7.0] - 2026-03-05

#### Added

- **Retry on error**: When a query fails (validation, SQL execution, or network), a "Nochmal versuchen" button appears; retry sends the previous error + SQL as context so the LLM can self-correct
- **SQL copy button**: One-click copy icon next to the SQL code block (with checkmark feedback)
- **Immediate question display**: User question bubble appears instantly on send, no longer waits for API response

#### Changed

- **Network error handling**: Friendly German message ("Server nicht erreichbar…") instead of raw TypeError on connection failure
- **Error state UX**: Failed first-message no longer snaps back to the empty splash screen; chat view stays visible with question + error
- **Backend `error_context`**: New optional field on `POST /query` — previous error + SQL forwarded to the LLM prompt for self-healing retries

### [0.6.3] - 2026-03-05

#### Changed

- **AGENTS.md**: Added explicit semver rules (patch for Changed/Fixed, minor only for Added)

### [0.6.2] - 2026-03-05

#### Changed

- **Chat input auto-grow**: Textarea grows line by line with content up to a max height instead of showing a scrollbar (like Gemini)
- **Chat input spacing**: Added container padding so text no longer touches the border
- **Accessibility**: Added `name` attribute to chat textarea to fix form field warning

### [0.6.1] - 2026-03-04

#### Changed

- **Sidebar layout**: Logo row + sidebar toggle moved into sidebar header; toggle stays visible when collapsed
- "Neuer Chat" button moved one row below logo for cleaner hierarchy
- Removed sidebar trigger from main content header — lives entirely in sidebar now

### [0.6.0] - 2026-03-04

#### Added

- **Table export**: CSV and Excel download buttons below result tables (full dataset, not just visible rows)
- **Progressive loading**: Tables show first 50 rows as preview, "Load more" button to reveal additional rows in 50-row increments
- **Safety limit warning**: Amber banner when backend's 100K row safety limit is reached, indicating possible data truncation
- **Geist font**: Modern typography with Geist Sans and Geist Mono, antialiased rendering

#### Changed

- **Backend SQL limits**: Removed forced `LIMIT 5000` from LLM prompt — LLM now decides based on query intent. System safety net at 100K rows (was 1000)
- **LLM interpreter prompt**: Now returns 1-3 sentence summary instead of repeating individual rows (table is already displayed)
- **LLM language default**: German by default, English only when user's question is clearly English
- **Chat input**: Textarea stays editable while LLM is thinking (only send button disabled)
- **Page title**: Changed from "frontend" to "AskDB"

### [0.5.0] - 2026-03-04

#### Changed

- **Frontend UI overhaul**: modern chat layout inspired by ChatGPT/Gemini — user messages as right-aligned bubbles, bot responses left-aligned with icon
- Sticky header with sidebar trigger and theme toggle — no longer scrolls away
- Chat messages use native `overflow-y-auto` instead of shadcn ScrollArea — fixes content overflow
- Result tables scroll horizontally for wide data instead of breaking layout
- Chat input centered with `max-w-3xl`, rounded corners, subtle shadow
- Sidebar uses `SidebarMenuButton` throughout for consistent collapsed icon alignment
- Conversation list hidden when sidebar collapsed (only "New Conversation" icon visible)
- Empty state redesigned with branded splash screen
- Docker Compose: removed separate `ready` container, simplified to 3 services

#### Fixed

- **Critical**: "Neue Konversation" button passed MouseEvent to `createConversation()` as title — caused circular JSON serialization crash and blank screen
- Nested `<button>` inside `SidebarMenuButton` — invalid HTML, replaced with `<span role="button">`

### [0.4.0] - 2026-03-04

#### Added

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui chat interface
- Chat sidebar with conversation history (localStorage persistence)
- Collapsible SQL/Reasoning/Steps detail section per message
- Data result table with column headers from API response
- Light/Dark/System theme toggle via shadcn ThemeProvider
- TanStack Query v5 for server-state management (`useMutation` for `POST /query`)
- **Chat memory**: conversation history passed to LLM for contextual follow-up questions
- **Sliding window + summary**: last 5 messages sent verbatim, older messages condensed via `POST /summarize` endpoint
- `POST /summarize` backend endpoint — LLM condenses older chat messages into compact summary retaining DB entities, table names, and key results
- Docker multi-stage build for frontend (Node 22 build → nginx serving)
- nginx reverse proxy config: SPA routing + `/api/` proxy to backend

#### Changed

- `POST /query` request model: added optional `history` (list of Q&A entries) and `history_summary` fields
- `generate_sql()` and `interpret_results()` now accept conversation context
- Docker Compose: added `frontend` service on port 3000

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
