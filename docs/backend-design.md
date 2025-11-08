## Sprint Planning Backend Overview

### Goals
- Accept structured meeting context from the frontend (participants, roles, project metadata, transcript, GitHub context).
- Orchestrate planning workflows by delegating heavy analysis to external Agentuity agents.
- Persist lightweight planning artefacts (meeting summary, milestones, assignments) in memory for now so the frontend can fetch the result.

### High-Level Flow
1. Frontend submits a `POST /api/v1/meetings/{meetingId}/plan` request with:
   - Meeting metadata (project, repo URL, sprint target).
   - Participants with roles.
   - Full transcript text (or URL to transcript).
2. Backend validates the payload, normalises transcript, and stores an in-memory record keyed by `meetingId`.
3. Planning service composes a job payload (meeting context + Agentuity workflow) and submits it via the Agentuity Client (`/jobs` endpoint when available).
4. Agentuity runs the configured agents; once the job finishes the backend polls `GET /jobs/{jobId}` to collect the structured plan.
5. Backend persists the latest plan in memory and returns it to the caller. Future iterations can move this to a database or webhook-based updates.

### API Contract (initial draft)

#### Create or Update Plan
`POST /api/v1/meetings/{meetingId}/plan`

Request body:
```json
{
  "project": {
    "name": "Nova Meeting Planner",
    "repositoryUrl": "https://github.com/example/repo",
    "goal": "Ship sprint planner enhancements"
  },
  "participants": [
    {"name": "Alex", "role": "Tech Lead"},
    {"name": "Priya", "role": "Backend Engineer"}
  ],
  "transcript": "Full transcript text...",
  "issues": [
    {"id": 123, "title": "Improve sprint planning automation"}
  ]
}
```

Response body:
```json
{
  "meetingId": "sp-2025-11-08",
  "status": "processing",
  "plan": null
}
```

The request returns immediately while the agent works. Later requests can fetch the generated plan once ready.

#### Fetch Plan
`GET /api/v1/meetings/{meetingId}/plan`

Response body (when ready):
```json
{
  "meetingId": "sp-2025-11-08",
  "status": "ready",
  "plan": {
    "summary": "High-level overview",
    "milestones": [
      {
        "title": "Milestone 1",
        "dueDate": "2025-11-22",
        "tasks": [
          {
            "title": "Integrate Agentuity output",
            "owner": "Priya",
            "areas": ["backend/services/planning.py"],
            "etaDays": 3
          }
        ]
      }
    ]
  }
}
```

### Agentuity Integration
- Provide a pluggable client wrapper (`AgentuityClient`) with methods:
  - `submit_planning_job(meeting_context: MeetingContext) -> str` returning a job ID.
  - `get_job_result(job_id: str) -> PlanningPlan | None`.
- When Agentuity environment variables (`AGENTUITY_API_URL`, `AGENTUITY_API_KEY`) are set, real HTTP calls are issued; otherwise the client uses an in-memory stub for local testing.

### Persistence Strategy
- Use an in-memory store (`PlanningRepository`) keyed by meeting ID.
- Store both the raw meeting context and the latest planning result.
- Swap in a database (PostgreSQL, Redis) later without changing handlers.

### Next Steps
- Implement background polling or webhook handler to update plan status.
- Add authentication between frontend and backend.
- Extend schema to support attachments (design docs, metrics) that agents can reference.

 