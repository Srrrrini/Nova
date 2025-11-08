from __future__ import annotations

from ..repository import PlanningRepository
from ..schemas import MeetingContext, PlanStatus, PlanningPlan, PlanningResponse
from .agentuity import AgentuityClient


class PlanningService:
    def __init__(self, repository: PlanningRepository, agent_client: AgentuityClient) -> None:
        self._repository = repository
        self._agent_client = agent_client

    def submit_plan(self, context: MeetingContext) -> PlanningResponse:
        job = self._agent_client.submit_planning_job(context)
        record = self._repository.upsert_context(context, agent_job_id=job.job_id)
        if job.plan:
            self._repository.set_plan_result(context.meetingId, job.plan)
            record.plan = job.plan
            record.status = PlanStatus.ready
        return PlanningResponse(
            meetingId=record.meetingId,
            status=record.status,
            plan=record.plan,
            agentJobId=record.agentJobId,
            error=record.error,
        )

    def get_plan(self, meeting_id: str) -> PlanningResponse:
        record = self._repository.get(meeting_id)
        if not record:
            raise ValueError(f"No plan found for meeting '{meeting_id}'.")

        if record.status == PlanStatus.processing and record.agentJobId:
            plan = self._agent_client.get_job_result(record.agentJobId)
            if plan:
                updated = self._repository.set_plan_result(meeting_id, plan)
                if updated:
                    record = updated

        return PlanningResponse(
            meetingId=record.meetingId,
            status=record.status,
            plan=record.plan,
            agentJobId=record.agentJobId,
            error=record.error,
        )

