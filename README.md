# ask-db

Natural Language to SQL — internal tool for querying databases via chat.

## Quick Start

```bash
# 1. Set up environment
cp .env.example .env
# Edit .env: set LLM_API_KEY

# 2. Place DB dump in db/dumps/ (imported on first start)

# 3. Start everything (DB + Backend + Frontend)
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger docs | http://localhost:8000/docs |
| DB (MySQL) | localhost:3307 |

### Local frontend development

```bash
# Start DB + Backend in background
docker compose up -d db backend

# Start Vite dev server
cd frontend
pnpm install
pnpm dev
# → http://localhost:5173 (API proxied to localhost:8000)
```

## Structure

```
backend/   → FastAPI (Python)
frontend/  → React + TypeScript + shadcn/ui
db/        → MariaDB dump + docs
```

See [AGENTS.md](AGENTS.md) for technical details and [CHANGELOG.md](CHANGELOG.md) for version history.
