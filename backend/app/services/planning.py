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
        prompt: str | None = None
        try:
            plan = self._pipeline.generate_plan(context)
            prompt = self._pipeline.last_prompt
            self._repository.set_plan_result(context.meetingId, plan, prompt=prompt)
            record.plan = plan
            record.status = PlanStatus.ready
            record.prompt = prompt
            record.error = None
        except Exception as exc:  # pragma: no cover - rely on runtime logging/handling
            error_message = str(exc)
            prompt = self._pipeline.last_prompt
            self._repository.set_plan_result(
                context.meetingId, None, error=error_message, prompt=prompt
            )
            record.status = PlanStatus.failed
            record.plan = None
            record.error = error_message
            record.prompt = prompt
        response = PlanningResponse(
            meetingId=record.meetingId,
            status=record.status,
            plan=record.plan,
            agentJobId=record.agentJobId,
            error=record.error,
            transcript=context.transcript,
            prompt=prompt,
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
            transcript=record.context.transcript,
            prompt=record.prompt,
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

