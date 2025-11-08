from __future__ import annotations

from collections import defaultdict
from typing import Any, Dict, List

from .base import AgentPayload, BaseAgent

DEFAULT_EMPLOYEES = ['Ada Lovelace', 'Grace Hopper', 'Edsger Dijkstra', 'Radia Perlman']


class OptimizerAgent(BaseAgent):
    name = 'OptimizerAgent'

    def __init__(self, employees: List[str] | None = None) -> None:
        self.employees = employees or DEFAULT_EMPLOYEES

    async def run(self, payload: AgentPayload) -> AgentPayload:
        allocations: Dict[str, Dict[str, Any]] = {}
        for idx, task in enumerate(payload.tasks):
            owner = task.get('owner') or self.employees[idx % len(self.employees)]
            task['owner'] = owner
            if owner not in allocations:
                allocations[owner] = {'name': owner, 'capacity_hours': 120, 'utilization': 0.0, 'tasks': []}
            allocations[owner]['tasks'].append(task['id'])
            allocations[owner]['utilization'] += task['hours'] / allocations[owner]['capacity_hours']
        payload.context['allocations'] = list(allocations.values())
        payload.context.setdefault('logs', []).append('OptimizerAgent assigned owners')
        return payload
