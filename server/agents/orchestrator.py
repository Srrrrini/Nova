from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional

try:
    from agentuity import AgentuityClient
except ImportError:  # pragma: no cover - optional dependency during scaffolding
    AgentuityClient = None  # type: ignore

from .base import AgentPayload
from .dependency import DependencyAgent
from .estimator import EstimatorAgent
from .optimizer import OptimizerAgent
from .reporter import ReporterAgent
from .task_parser import TaskParserAgent
from ..utils.openrouter import OpenRouterClient


class ProjectOrchestrator:
    def __init__(self) -> None:
        self.llm = OpenRouterClient()
        self.agentuity: Optional[AgentuityClient] = None
        api_key = os.getenv('AGENTUITY_API_KEY')
        if AgentuityClient and api_key:
            self.agentuity = AgentuityClient(api_key=api_key)

        self.agents = [
            TaskParserAgent(),
            DependencyAgent(self.llm),
            EstimatorAgent(),
            OptimizerAgent(),
            ReporterAgent()
        ]

    async def analyze(self, tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
        payload = AgentPayload(tasks=tasks, context={'logs': []})
        for agent in self.agents:
            payload = await agent.run(payload)
            await self._track_agentuity(agent.name, payload)

        return {
            'tasks': payload.tasks,
            'employees': payload.context.get('allocations', []),
            'summary': payload.context.get('summary', {})
        }

    async def report(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        summary = analysis.get('summary', {})
        report_text = self._build_report_text(analysis)
        return {
            'summary': summary,
            'report': report_text,
            'download_url': 'data:application/json,' + json.dumps(analysis),
            'voice_url': None
        }

    async def _track_agentuity(self, agent_name: str, payload: AgentPayload) -> None:
        if not self.agentuity:
            return
        try:
            self.agentuity.log(  # type: ignore[attr-defined]
                agent_name=agent_name,
                data={'tasks': payload.tasks, 'context': payload.context}
            )
        except Exception:  # pragma: no cover - optional telemetry
            pass

    def _build_report_text(self, analysis: Dict[str, Any]) -> str:
        summary = analysis.get('summary', {})
        employees = analysis.get('employees', [])
        sections = [
            'Agentic Project Overview',
            f"Total hours: {summary.get('total_hours')}",
            f"Staffing: {summary.get('staffing')}",
            'Assignments:'
        ]
        for employee in employees:
            sections.append(f"- {employee['name']}: {', '.join(employee['tasks'])}")
        return '\n'.join(sections)
