from __future__ import annotations

from typing import Any, Dict, List

from .base import AgentPayload, BaseAgent


class TaskParserAgent(BaseAgent):
    name = 'TaskParserAgent'

    async def run(self, payload: AgentPayload) -> AgentPayload:
        tasks: List[Dict[str, Any]] = []
        for idx, task in enumerate(payload.tasks, start=1):
            depends = task.get('depends_on') or task.get('dependencies') or []
            depends = [d.strip() for d in depends if d]
            tasks.append(
                {
                    'id': task.get('id') or f'T{idx}',
                    'name': task['name'],
                    'description': task.get('description', ''),
                    'owner': task.get('owner') or 'Unassigned',
                    'depends_on': depends
                }
            )
        payload.tasks = tasks
        payload.context.setdefault('logs', []).append('Parsed tasks into canonical structure')
        return payload
