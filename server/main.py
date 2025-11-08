from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .agents import ProjectOrchestrator
from .utils.storage import append_history


class TaskPayload(BaseModel):
    name: str
    description: str = ''
    owner: str | None = None
    depends_on: List[str] = Field(default_factory=list)


class AnalyzeRequest(BaseModel):
    tasks: List[TaskPayload]


class ReportRequest(BaseModel):
    analysis: Dict[str, Any]


app = FastAPI(title='Agentic Planner API')
router = APIRouter(prefix='/api')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*']
)

orchestrator = ProjectOrchestrator()


@router.get('/health')
async def health() -> Dict[str, str]:
    return {'status': 'ok'}


@router.post('/analyze')
async def analyze(request: AnalyzeRequest) -> Dict[str, Any]:
    if not request.tasks:
        raise HTTPException(status_code=400, detail='Provide at least one task.')
    result = await orchestrator.analyze([task.model_dump() for task in request.tasks])
    append_history({'type': 'analysis', 'payload': result})
    return result


@router.post('/report')
async def report(request: ReportRequest) -> Dict[str, Any]:
    if not request.analysis:
        raise HTTPException(status_code=400, detail='Missing analysis payload.')
    result = await orchestrator.report(request.analysis)
    append_history({'type': 'report', 'payload': result})
    return result


app.include_router(router)


def get_app() -> FastAPI:
    return app
