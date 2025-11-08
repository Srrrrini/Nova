## Sprint Planning Backend Overview

### Goals
- Accept structured meeting context from the frontend (participants, roles, project metadata, transcript, GitHub context).
- Orchestrate planning workflows by delegating heavy analysis to a programmable chain of OpenRouter prompts.
- Persist lightweight planning artefacts (meeting summary, milestones, assignments) in memory for now so the frontend can fetch the result.

### High-Level Flow
1. Frontend submits a `POST /api/v1/meetings/{meetingId}/plan` request with:
   - Meeting metadata (project, repo URL, sprint target).
   - Participants with roles.
   - Full transcript text (or URL to transcript).
2. Backend validates the payload, normalises transcript, and stores an in-memory record keyed by `meetingId`.
3. Planning service executes a six-step OpenRouter pipeline that:
   - Summarises the meeting,
   - Identifies risks,
   - Drafts action items,
   - Gathers GitHub code context (when a `repositoryUrl` is provided) and maps work to code areas,
   - Proposes milestones,
   - Composes a final `PlanningPlan` JSON structure.
4. Backend persists the latest plan in memory and returns it to the caller. Future iterations can move this to a database or background processing if prompt latency becomes an issue.

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

The request runs synchronously. If the prompt chain completes successfully the response contains the finished plan; otherwise it reports `status: "failed"` with an error message.

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

### OpenRouter Integration
- Provide a lightweight client wrapper (`OpenRouterClient`) with a `complete(messages, ...)` helper.
- Encapsulate the six-step prompt chain inside `OpenRouterPlanningPipeline`, ensuring each intermediary response feeds the next prompt and pulls GitHub code snippets via `GitHubCodeSearcher` when possible. Requests use a retry-capable OpenRouter client to soften transient timeouts.
- Enforce JSON validation on the final step so the backend only persists schema-compliant plans.

### Persistence Strategy
- Use an in-memory store (`PlanningRepository`) keyed by meeting ID.
- Store both the raw meeting context and the latest planning result.
- Swap in a database (PostgreSQL, Redis) later without changing handlers.

### Next Steps
- Implement background polling or webhook handler to update plan status.
- Add authentication between frontend and backend.
- Extend schema to support attachments (design docs, metrics) that agents can reference.

 