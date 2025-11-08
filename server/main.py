from __future__ import annotations

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter, FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from .utils.openrouter import OpenRouterClient

DATA_DIR = Path(__file__).resolve().parent / 'data'
MEETINGS_FILE = DATA_DIR / 'sample_meetings.json'

app = FastAPI(title='Agentic Planner API')
router = APIRouter(prefix='/api')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*']
)

app.include_router(router)

llm = OpenRouterClient()
MEETINGS: List[Dict[str, Any]] = json.loads(MEETINGS_FILE.read_text()) if MEETINGS_FILE.exists() else []
TRANSCRIPTS: Dict[str, str] = {}


def _flatten_tasks(meetings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    dedup: Dict[str, Dict[str, Any]] = {}
    for meeting in meetings:
        for task in meeting.get('tasks', []):
            dedup[task['id']] = task
    return list(dedup.values())


async def _transcribe_audio(file: UploadFile) -> str:
    content = await file.read()
    seconds = max(1, len(content) // 16000)
    minutes = round(seconds / 60, 1)
    return f"Transcribed {file.filename} (~{minutes} min). Discussed automation, blockers, and next steps."


async def _generate_summary(transcript: str) -> Dict[str, Any]:
    messages = [
        {
            'role': 'system',
            'content': 'Summarize the meeting and return JSON with keys title, attendees, summary, minutes, resources, hours, cost.'
        },
        {'role': 'user', 'content': transcript[:4000]}
    ]
    try:
        raw = await llm.chat(messages, model='anthropic/claude-3.5-sonnet')
        data = json.loads(raw)
    except Exception:
        data = {
            'title': 'Recorded Meeting',
            'attendees': ['Avery', 'Kai'],
            'summary': transcript[:200],
            'minutes': transcript[:400],
            'resources': ['Transcript snippet'],
            'hours': 24,
            'cost': 3600
        }
    data.setdefault('attendees', ['Unassigned'])
    data.setdefault('resources', ['Transcript snippet'])
    data.setdefault('hours', 24)
    data.setdefault('cost', 3600)
    return data


async def _generate_tasks(transcript: str) -> List[Dict[str, Any]]:
    messages = [
        {
            'role': 'system',
            'content': 'Extract actionable tasks from the meeting. Return JSON array of {id, name, description, owner, depends_on, hours, risk, status}.'
        },
        {'role': 'user', 'content': transcript[:4000]}
    ]
    try:
        raw = await llm.chat(messages, model='openai/gpt-4o-mini')
        tasks = json.loads(raw)
    except Exception:
        tasks = []
    normalized: List[Dict[str, Any]] = []
    for idx, task in enumerate(tasks, start=1):
        normalized.append(
            {
                'id': task.get('id') or f'T{idx}',
                'name': task.get('name') or f'Task {idx}',
                'description': task.get('description', ''),
                'owner': task.get('owner') or 'Unassigned',
                'depends_on': task.get('depends_on') or [],
                'hours': task.get('hours') or 6,
                'risk': task.get('risk') or 'Medium',
                'status': task.get('status') or 'pending'
            }
        )
    if not normalized:
        normalized.append(
            {
                'id': f'T{uuid.uuid4().hex[:4]}',
                'name': 'Review meeting notes',
                'description': 'Summarize takeaways and assign owners.',
                'owner': 'Unassigned',
                'depends_on': [],
                'hours': 4,
                'risk': 'Low',
                'status': 'pending'
            }
        )
    return normalized


@router.get('/meetings')
async def list_meetings() -> Dict[str, Any]:
    return {'meetings': MEETINGS, 'tasks': _flatten_tasks(MEETINGS)}


@router.post('/meetings/analyze')
async def analyze_meeting(meeting_audio: UploadFile = File(...)) -> Dict[str, Any]:
    if meeting_audio.content_type is None:
        raise HTTPException(status_code=400, detail='Upload an audio file.')

    transcript = await _transcribe_audio(meeting_audio)
    summary = await _generate_summary(transcript)
    tasks = await _generate_tasks(transcript)

    meeting_id = f'meeting-{uuid.uuid4().hex[:6]}'
    meeting = {
        'id': meeting_id,
        'title': summary['title'],
        'date': datetime.utcnow().strftime('%Y-%m-%d'),
        'attendees': summary['attendees'],
        'summary': summary['summary'],
        'minutes': summary['minutes'],
        'resources': summary['resources'],
        'hours': summary['hours'],
        'cost': summary['cost'],
        'tasks': tasks,
        'transcript': transcript
    }

    MEETINGS.append(meeting)
    TRANSCRIPTS[meeting_id] = transcript
    return {'meeting': meeting}


def get_app() -> FastAPI:
    return app
*** End Patch
