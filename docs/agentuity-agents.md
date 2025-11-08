## Agentuity Agent Definitions

### 1. Context Summarizer Agent
- **Goal**: Ingest raw meeting transcript, extract key decisions, actionable items, and unresolved questions.
- **Inputs**:
  - Full transcript text
  - Participant roster with roles
  - Project metadata (name, repo URL, sprint goal)
- **Outputs**:
  - Structured summary (decisions, action items, risks)
  - Highlighted quotes or timestamps (if available)
- **Tools Needed**:
  - Text chunker for long transcripts
  - Optional: knowledge base lookup (project docs, Confluence, etc.)
- **Handoff**: Feed summary artefacts to Repo Strategist and Milestone Planner.

### 2. Repo Strategist Agent
- **Goal**: Map summarized action items to concrete code areas, issues, and technical tasks.
- **Inputs**:
  - Context Summarizer output (action items + risks)
  - Repository URL(s)
  - Relevant issue references from the meeting payload
- **Outputs**:
  - Suggested code touch points (files, services, modules)
  - Recommended GitHub issues or new ticket drafts
  - Technical considerations or dependencies
- **Tools Needed**:
  - GitHub search / code search API
  - Issue tracker connector (GitHub REST/GraphQL, Jira, etc.)
  - Optional: database query ability for architecture metadata
- **Handoff**: Provide findings to Milestone Planner for scheduling and assignment.

### 3. Milestone Planner Agent
- **Goal**: Organize the technical tasks into milestones with owners, timelines, and risk mitigations.
- **Inputs**:
  - Repo Strategist deliverables (tasks, touch points)
  - Team roster with roles
  - Sprint cadence or deadlines (from project metadata)
- **Outputs**:
  - Milestones and task breakdown
  - Owner assignments + estimated durations
  - Risk register / follow-up actions
- **Tools Needed**:
  - Calendar/Sprint metadata (optional integration)
  - Historical velocity data (future enhancement)
- **Handoff**: Return final plan to backend for persistence and frontend display.

### Orchestration Notes
- Backend composes a single Agentuity job describing the three-agent workflow.
- Context Summarizer runs first and shares artefacts with the remaining agents.
- Repo Strategist uses both meeting context and summaries to produce technical recommendations.
- Milestone Planner finalizes the plan and returns a structure compatible with `PlanningPlan`.
- Future enhancement: add a Validation agent to cross-check plan feasibility and surface open questions.

