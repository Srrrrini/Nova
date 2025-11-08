from __future__ import annotations

from typing import Any, Dict, List

from .base import AgentPayload, BaseAgent
from ..utils.openrouter import OpenRouterClient


class DependencyAgent(BaseAgent):
    name = 'DependencyAgent'

    def __init__(self, llm: OpenRouterClient) -> None:
        self.llm = llm

    async def run(self, payload: AgentPayload) -> AgentPayload:
        tasks = payload.tasks
        if not tasks:
            return payload

        if self.llm.api_key:
            prompt = self._build_prompt(tasks)
            await self.llm.chat(prompt)
        # Lightweight heuristic fallback: if a task mentions another name, add dependency
        names = {task['name']: task['id'] for task in tasks}
        for task in tasks:
            for candidate_name, candidate_id in names.items():
                if candidate_name == task['name']:
                    continue
                if candidate_name.lower() in task['description'].lower() and candidate_id not in task['depends_on']:
                    task['depends_on'].append(candidate_id)
        payload.context.setdefault('logs', []).append('DependencyAgent linked tasks')
        payload.tasks = tasks
        return payload

    def _build_prompt(self, tasks: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        content_lines = [
            'You are DependencyAgent. Return JSON with id => depends_on array.'
        ]
        for task in tasks:
            content_lines.append(f"Task {task['id']}: {task['name']} :: {task['description']}")
        return [
            {
                'role': 'user',
                'content': '\n'.join(content_lines)
            }
        ]
