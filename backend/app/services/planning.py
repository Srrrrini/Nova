from __future__ import annotations


import os
import uuid
from pathlib import Path

from ..repository import PlanningRepository
from ..schemas import MeetingContext, PlanStatus, PlanningResponse
from .openrouter_pipeline import OpenRouterPlanningPipeline

_DEFAULT_OUTPUT_DIR = (
    Path(os.getenv("PLANS_OUTPUT_DIR"))
    if os.getenv("PLANS_OUTPUT_DIR")
    else Path(__file__).resolve().parent.parent.parent / "data" / "plans"
)


class PlanningService:
    def __init__(
        self,
        repository: PlanningRepository,
        pipeline: OpenRouterPlanningPipeline,
        *,
        output_dir: Path | str | None = None,
    ) -> None:
        self._repository = repository
        self._pipeline = pipeline
        resolved_dir = Path(output_dir) if output_dir else _DEFAULT_OUTPUT_DIR
        resolved_dir.mkdir(parents=True, exist_ok=True)
        self._output_dir = resolved_dir

    def submit_plan(self, context: MeetingContext) -> PlanningResponse:
        job_id = str(uuid.uuid4())
        record = self._repository.upsert_context(context, agent_job_id=job_id)
        try:
            plan = self._pipeline.generate_plan(context)
            self._repository.set_plan_result(context.meetingId, plan)
            record.plan = plan
            record.status = PlanStatus.ready
        except Exception as exc:  # pragma: no cover - rely on runtime logging/handling
            error_message = str(exc)
            self._repository.set_plan_result(context.meetingId, None, error=error_message)
            record.status = PlanStatus.failed
            record.plan = None
            record.error = error_message
        response = PlanningResponse(
            meetingId=record.meetingId,
            status=record.status,
            plan=record.plan,
            agentJobId=record.agentJobId,
            error=record.error,
        )
        self._persist_response(response)
        return response

    def get_plan(self, meeting_id: str) -> PlanningResponse:
        record = self._repository.get(meeting_id)
        if not record:
            raise ValueError(f"No plan found for meeting '{meeting_id}'.")

        response = PlanningResponse(
            meetingId=record.meetingId,
            status=record.status,
            plan=record.plan,
            agentJobId=record.agentJobId,
            error=record.error,
        )
        self._persist_response(response)
        return response

    def _persist_response(self, response: PlanningResponse) -> None:
        try:
            target_path = self._output_dir / f"{response.meetingId}.json"
            with target_path.open("w", encoding="utf-8") as handle:
                handle.write(response.model_dump_json(indent=2))
        except Exception:
            # Persistence failures shouldn't break API responses; surface via stdout for now.
            print(f"[warn] Failed to persist plan for {response.meetingId}")  # pragma: no cover

