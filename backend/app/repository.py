from __future__ import annotations

from threading import Lock
from typing import Dict, Optional

from .schemas import MeetingContext, PlanStatus, PlanningPlan, PlanningRecord


class PlanningRepository:
    """Simple in-memory repository for meeting plans."""

    def __init__(self) -> None:
        self._records: Dict[str, PlanningRecord] = {}
        self._lock = Lock()

    def upsert_context(self, context: MeetingContext, agent_job_id: Optional[str] = None) -> PlanningRecord:
        with self._lock:
            existing = self._records.get(context.meetingId)
            if existing:
                existing.context = context
                existing.status = PlanStatus.processing
                existing.agentJobId = agent_job_id or existing.agentJobId
                existing.error = None
                existing.plan = None
                record = existing
            else:
                record = PlanningRecord(
                    meetingId=context.meetingId,
                    context=context,
                    status=PlanStatus.processing,
                    plan=None,
                    agentJobId=agent_job_id,
                )
                self._records[context.meetingId] = record
        return record

    def set_plan_result(
        self, meeting_id: str, plan: Optional[PlanningPlan], error: Optional[str] = None
    ) -> Optional[PlanningRecord]:
        with self._lock:
            record = self._records.get(meeting_id)
            if not record:
                return None
            if error:
                record.status = PlanStatus.failed
                record.error = error
                record.plan = None
            else:
                record.status = PlanStatus.ready
                record.plan = plan
                record.error = None
        return record

    def get(self, meeting_id: str) -> Optional[PlanningRecord]:
        with self._lock:
            record = self._records.get(meeting_id)
            if not record:
                return None
            return PlanningRecord(**record.model_dump())

