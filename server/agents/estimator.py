from __future__ import annotations

import math
from typing import Any, Dict, List

from .base import AgentPayload, BaseAgent


class EstimatorAgent(BaseAgent):
    name = 'EstimatorAgent'

    async def run(self, payload: AgentPayload) -> AgentPayload:
        for task in payload.tasks:
            description = task.get('description', '')
            baseline = max(1, len(description.split()))
            hours = math.ceil(baseline / 3) * 2 + 8
            task['hours'] = hours
            task['risk'] = self._risk_from_text(description)
            task['status'] = 'pending'
        payload.context.setdefault('logs', []).append('EstimatorAgent added hours + risk')
        return payload

    def _risk_from_text(self, text: str) -> str:
        if any(word in text.lower() for word in ['migrate', 'compliance', 'security']):
            return 'High'
        if any(word in text.lower() for word in ['integration', 'prototype']):
            return 'Medium'
        return 'Low'
