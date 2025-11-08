from __future__ import annotations

import os
import uuid
from dataclasses import dataclass
from typing import Any, Dict, Optional

import httpx

from ..config import load_agentuity_config
from ..schemas import MeetingContext, PlanningPlan, TaskAssignment, Milestone


@dataclass
class AgentuityJob:
    job_id: str
    meeting_id: str
    plan: Optional[PlanningPlan]


class AgentuityClient:
    """
    Agentuity client abstraction.

    If `AGENTUITY_API_URL` is present in the environment, real Agentuity REST calls
    are issued. Otherwise the client falls back to a deterministic stub so the backend
    can be exercised locally without external dependencies.
    """

    def __init__(self, config_path: Optional[str] = None) -> None:
        self._config = load_agentuity_config(config_path)
        self._base_url = os.getenv("AGENTUITY_API_URL")
        self._api_key = os.getenv("AGENTUITY_API_KEY")

    def submit_planning_job(self, context: MeetingContext) -> AgentuityJob:
        payload = self._build_job_payload(context)

        if self._base_url:
            response_data = self._submit_remote_job(payload)
            job_id = response_data["jobId"]
            plan_data = response_data.get("plan")
            plan = PlanningPlan.model_validate(plan_data) if plan_data else None
            return AgentuityJob(job_id=job_id, meeting_id=context.meetingId, plan=plan)

        # Fallback: simulate an Agentuity response locally
        job_id = str(uuid.uuid4())
        fake_plan = self._generate_placeholder_plan(context)
        return AgentuityJob(job_id=job_id, meeting_id=context.meetingId, plan=fake_plan)

    def get_job_result(self, job_id: str) -> Optional[PlanningPlan]:
        if not self._base_url:
            return None

        headers = self._build_headers()
        with httpx.Client(base_url=self._base_url, timeout=30.0) as client:
            response = client.get(f"/jobs/{job_id}", headers=headers)
            response.raise_for_status()
            data = response.json()
        plan_data = data.get("plan")
        if not plan_data:
            return None
        return PlanningPlan.model_validate(plan_data)

    def _submit_remote_job(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        headers = self._build_headers()
        with httpx.Client(base_url=self._base_url, timeout=30.0) as client:
            response = client.post("/jobs", json=payload, headers=headers)
            response.raise_for_status()
            return response.json()

    def _build_headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"
        return headers

    def _build_job_payload(self, context: MeetingContext) -> Dict[str, Any]:
        return {
            "meetingId": context.meetingId,
            "project": context.project.model_dump(),
            "participants": [participant.model_dump() for participant in context.participants],
            "transcript": context.transcript,
            "issues": [issue.model_dump() for issue in context.issues],
            "agents": self._config.get("agents", []),
            "workflow": self._config.get("workflow", {}),
        }

    def _generate_placeholder_plan(self, context: MeetingContext) -> PlanningPlan:
        participants = ", ".join(p.name for p in context.participants)
        summary = (
            f"Draft plan for project '{context.project.name}'. "
            f"Participants: {participants}. This is a placeholder until Agentuity integration is wired."
        )
        tasks = [
            TaskAssignment(
                title="Review transcript highlights and extract actionable tasks",
                owner=context.participants[0].name if context.participants else None,
                areas=["planning/analysis"],
                etaDays=1,
                notes="Replace with Agentuity output.",
            ),
            TaskAssignment(
                title="Generate sprint milestone draft",
                owner=context.participants[1].name if len(context.participants) > 1 else None,
                areas=["docs/milestones.md"],
                etaDays=2,
            ),
        ]
        milestones = [
            Milestone(title="Sprint Planning Draft", tasks=tasks),
        ]
        return PlanningPlan(summary=summary, milestones=milestones)

