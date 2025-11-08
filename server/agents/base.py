from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List


@dataclass
class AgentPayload:
    tasks: List[Dict[str, Any]]
    context: Dict[str, Any]


class BaseAgent:
    name: str

    async def run(self, payload: AgentPayload) -> AgentPayload:
        raise NotImplementedError
