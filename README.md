# Nova Sprint Planning Backend

This repository contains a backend prototype that receives sprint planning meeting data from a frontend, coordinates with Agentuity agents, and returns structured plans (milestones, assignments, timelines).

## Project Layout

- `backend/` – FastAPI service implementation
  - `app/main.py` – FastAPI app and routing
  - `app/schemas.py` – Pydantic models for requests and responses
  - `app/repository.py` – In-memory storage for meeting plans
  - `app/services/` – Agentuity client stub and planning orchestration
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

5. (Optional) Configure Agentuity integration by setting environment variables before starting the server:

   ```powershell
   $env:AGENTUITY_API_URL = "https://api.agentuity.example.com"
   $env:AGENTUITY_API_KEY = "<your-api-key>"
   uvicorn app.main:app --reload
   ```

   Without these variables the backend uses a deterministic stubbed plan for local development.

## Sample Usage

```powershell
curl -X POST http://127.0.0.1:8000/api/v1/meetings/sp-2025-11-08/plan `
  -H "Content-Type: application/json" `
  -d @{
    meetingId = "sp-2025-11-08"
    project = @{
      name = "Nova Meeting Planner"
      repositoryUrl = "https://github.com/example/repo"
    }
    participants = @(
      @{ name = "Alex"; role = "Tech Lead" },
      @{ name = "Priya"; role = "Backend Engineer" }
    )
    transcript = "Sprint planning discussion transcript..."
    issues = @(
      @{ id = "123"; title = "Improve sprint planning automation" }
    )
  } | ConvertTo-Json -Compress
```

5. Query the generated plan:

   ```powershell
   curl http://127.0.0.1:8000/api/v1/meetings/sp-2025-11-08/plan
   ```

## Next Steps

- Replace the Agentuity client stub with real API calls.
- Introduce persistent storage (PostgreSQL/Redis) for meeting plans.
- Add background job processing or webhooks for asynchronous agent updates.
- Enforce authentication/authorization between the frontend and backend.
