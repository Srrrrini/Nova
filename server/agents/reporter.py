from __future__ import annotations

from typing import Any, Dict

from .base import AgentPayload, BaseAgent


class ReporterAgent(BaseAgent):
    name = 'ReporterAgent'

    async def run(self, payload: AgentPayload) -> AgentPayload:
        tasks = payload.tasks
        total_hours = sum(task['hours'] for task in tasks)
        summary = {
            'total_hours': total_hours,
            'staffing': f"{len(payload.context.get('allocations', []))} employees (~{round(total_hours / 40, 1)} sprints)",
            'risks': list({task['risk'] for task in tasks if task.get('risk') != 'Low'}),
            'blockers': ['Awaiting approvals'] if any(task['risk'] == 'High' for task in tasks) else []
        }
        payload.context['summary'] = summary
        payload.context.setdefault('logs', []).append('ReporterAgent compiled summary')
        return payload
