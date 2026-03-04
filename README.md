# ask-db

Natural Language to SQL — internal tool for querying databases via chat.

## Quick Start

```bash
# 1. Set up environment
cp .env.example .env
# Edit .env: set LLM_API_KEY

# 2. Place DB dump in db/dumps/ (imported on first start)

# 3. Start
docker compose up --build
```

Backend runs at http://localhost:8000 — interactive docs at http://localhost:8000/docs

## Usage

```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "How many active participants does OC have?"}'
```

## Structure

```
backend/   → FastAPI (Python)
db/        → MariaDB dump + docs
frontend/  → React app (coming later)
```

See [AGENTS.md](AGENTS.md) for technical details and [CHANGELOG.md](CHANGELOG.md) for version history.
