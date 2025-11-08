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
