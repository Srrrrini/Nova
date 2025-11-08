# Nova Sprint Planning Backend

This repository contains a backend prototype that receives sprint planning meeting data from a frontend, orchestrates a series of OpenRouter prompts, and returns structured plans (milestones, assignments, timelines).

## Project Layout

- `backend/` – FastAPI service implementation
  - `app/main.py` – FastAPI app and routing
  - `app/schemas.py` – Pydantic models for requests and responses
  - `app/repository.py` – In-memory storage for meeting plans
  - `app/services/` – OpenRouter client, prompt pipeline, and planning orchestration
- `docs/backend-design.md` – High-level architecture and API contract

## Getting Started

1. Create and activate a virtual environment (Python 3.11+ recommended):

   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

2. Install dependencies:

   ```powershell
   pip install -r requirements.txt
   ```

3. Run the development server:

   ```powershell
   uvicorn app.main:app --reload
   ```

4. Open the interactive docs at `http://127.0.0.1:8000/docs` to exercise the endpoints.

5. Configure OpenRouter access by exporting the required variables before starting the server:

   ```powershell
   $env:OPENROUTER_API_KEY = "<your-openrouter-api-key>"
   # Optional overrides:
   # $env:OPENROUTER_MODEL = "anthropic/claude-3-haiku"
   # $env:OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
   # $env:OPENROUTER_TIMEOUT = "120"  # seconds
   # $env:OPENROUTER_RETRIES = "3"   # number of attempts per request
   uvicorn app.main:app --reload
   ```

   Without a valid `OPENROUTER_API_KEY` the server will refuse to start, ensuring calls never leave your environment unexpectedly.

6. (Optional) Provide a GitHub personal access token if you want the planner to search code within the repository referenced by the meeting payload. The token only needs `contents` scope:

   ```powershell
   $env:GITHUB_TOKEN = "<github-personal-access-token>"
   ```

   Without it, code search falls back to best-effort heuristics using public API limits.

7. Each completed request persists the latest planning response as JSON under `backend/data/plans/{meetingId}.json` so the output can be inspected or shared later.

## Sample Usage

```powershell
curl -X POST http://127.0.0.1:8000/api/v1/meetings/sp-2025-11-08/plan `
  -H "Content-Type: application/json" `
  -d @{
    meetingId = "sp-2025-11-08"
    project = @{
      name = "Flask 3.1 Stability Sprint"
      repositoryUrl = "https://github.com/pallets/flask"  # GitHub repo scanned for code context
      goal = "Improve authentication stability and documentation ahead of the 3.1 release"
    }
    participants = @(
      @{ name = "Alice Chen"; role = "Engineering Manager" },
      @{ name = "Bob Martinez"; role = "Backend Engineer" },
      @{ name = "Priya Patel"; role = "DevOps Engineer" },
      @{ name = "Jonas Meyer"; role = "Tech Writer" }
    )
    transcript = "Alice: Let's align on sprint focus: shipping the 3.1 authentication fixes and tightening docs. Bob: Login failures were traced to the blueprint auth middleware; we need to refactor session refresh logic in flask/sessions.py and add regression tests. Priya: Deployment playbooks still reference the legacy WSGI config—I'll update the container recipe and CI workflow. Jonas: Docs need a migration note for the new session cookie flags, plus guidance for extensions."
    issues = @(
      @{ id = "ISSUE-123"; title = "Session refresh fails on production"; url = "https://github.com/pallets/flask/issues/5390" },
      @{ id = "ISSUE-341"; title = "Update deployment docs for container workflow"; url = "https://github.com/pallets/flask/issues/5143" },
      @{ id = "ISSUE-487"; title = "Document new secure cookie defaults"; url = "https://github.com/pallets/flask/issues/4910" }
    )
  } | ConvertTo-Json -Compress
```

5. Query the generated plan:

   ```powershell
   curl http://127.0.0.1:8000/api/v1/meetings/sp-2025-11-08/plan
   ```

## Next Steps

- Tune prompt templates for specific domains (e.g. mobile, data infra).
- Introduce persistent storage (PostgreSQL/Redis) for meeting plans.
- Add streaming responses or background execution for long-running prompt chains.
- Enforce authentication/authorization between the frontend and backend.
# Agentic Project Planner

A full-stack demo showing how OpenRouter reasoning, Modal-hosted FastAPI, and Agentuity orchestration can produce dependency-aware project plans with DAG + Gantt visualizations.

## Architecture
- **Client (`/client`)** – Vite + React + TypeScript + TailwindCSS UI with React Flow (dependencies) and Recharts (timeline + staffing metrics).
- **Server (`/server`)** – FastAPI API deployed locally or via Modal. Agents coordinate task parsing, dependency detection, estimation, optimization, and reporting.
- **Agents** – Agentuity-aware pipeline (`TaskParser → Dependency → Estimator → Optimizer → Reporter`) with OpenRouter-backed reasoning where credentials exist; otherwise deterministic heuristics.
- **Storage** – Lightweight JSON history (extendable to SQLite) and downloadable analysis payloads for auditability.

## Prerequisites
- Node.js 18+
- Python 3.11+
- Modal CLI (`pip install modal-client`), authenticated via `modal token new`
- Accounts + API keys for [OpenRouter](https://openrouter.ai/), [Agentuity](https://www.agentuity.com/), and (optional) TTS service if you extend `/report` audio output

## Environment Variables
Duplicate `.env.example` into the correct locations:

```bash
cp .env.example client/.env
cp .env.example server/.env
```

| Variable | Where | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | client | URL the frontend targets (default `http://localhost:8000`) |
| `VITE_API_PROXY` | client | Proxy target for Vite dev server; enables `/api` calls |
| `OPENROUTER_API_KEY` | server | Routes LLM calls via OpenRouter (Claude 3.5 / GPT-4-Turbo / Llama 3.1) |
| `OPENROUTER_DEFAULT_MODEL` | server | Override default LLM |
| `AGENTUITY_API_KEY` | server | Enables real Agentuity orchestration + tracing |
| `MODAL_TOKEN_ID` / `MODAL_TOKEN_SECRET` | server | Required to deploy the FastAPI app with Modal |

## Install & Run Locally

### 1. Frontend
```bash
cd client
npm install
npm run dev
```
This launches Vite on `http://localhost:5173` with a proxy to `http://localhost:8000/api`.

### 2. Backend (FastAPI)
```bash
cd server
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn server.main:app --reload
```
Endpoints:
- `POST /api/analyze` – accepts `{ tasks: RawTaskInput[] }`, returns employees, enriched tasks, and summary.
- `POST /api/report` – accepts `{ analysis }`, returns narrative text + downloadable JSON (TTS hook ready).
- `GET /api/health` – liveness probe.

### 3. Modal Deployment (optional)
```bash
cd server
modal serve server.modal_app
# or
modal deploy server.modal_app
```
The `modal_app.py` wraps the FastAPI application with a scalable Modal function. Attach your secrets inside Modal (`modal secret create openrouter-keys`).

## Frontend Highlights
- **Task Intake** – Paste freeform backlog text or upload CSV/JSON. Tasks render in a preview grid prior to analysis.
- **Hooks** – `useProjectAnalysis` + `useReport` centralize API calls and gracefully fall back to mock data when offline.
- **Visualization** – React Flow shows DAG edges, while Recharts approximates a Gantt timeline based on estimated hours.
- **Reports Tab** – Generates exec summaries with download + audio placeholders.

Directory snapshot:
```
client/src
├── App.tsx
├── components/
├── hooks/
├── mock/
├── pages/
└── types/
```

## Backend Highlights
- **Agents** (`server/agents/`) – Modular classes for Task parsing, dependency inference, estimation, optimization, and reporting. Each mutation updates the shared `AgentPayload` context.
- **OpenRouter Client** – `utils/openrouter.py` centralizes LLM calls with graceful offline stubs for local development.
- **Storage** – `utils/storage.py` writes every analysis/report into `server/data/history.json` for lightweight persistence.
- **Modal Integration** – `server/modal_app.py` exposes the FastAPI app as an ASGI function ready for `modal serve` or `modal deploy`.

## Sample Tasks
Use `server/data/sample_tasks.json` or the default textarea seed in the UI:
```json
[
  { "name": "Ingest customer feedback", "description": "Aggregate historical customer feedback", "owner": "Ada" },
  { "name": "Train dependency agent", "description": "Use OpenRouter Claude 3.5 to extract cross-team deps", "owner": "Grace", "depends_on": ["Ingest customer feedback"] }
]
```

## Extending the Demo
1. **Voice Intake / TTS** – Hook a Whisper transcription endpoint on the backend and use Bark/XTTS for `/report.voice_url`.
2. **SQLite History** – Replace `utils/storage.append_history` with SQLAlchemy models for persistent project archives.
3. **Advanced Optimization** – Swap the heuristic scheduler for OR-Tools or an LLM-based optimizer via Agentuity multi-step plans.
4. **Auth & Multi-Tenancy** – Add Supabase / Clerk for user auth and scoped project histories.

## Development Tips
- React Flow and Recharts are already wired up; simply map new fields from the backend response.
- When OpenRouter or Agentuity keys are missing, the backend switches to deterministic mocks so the UI stays interactive.
- Prefer running `modal shell` or `modal deploy` only after validating endpoints locally with `uvicorn`.
