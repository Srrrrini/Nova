from __future__ import annotations

import math
from typing import Optional

from fastapi import UploadFile


async def transcribe_audio(upload: Optional[UploadFile]) -> str:
    """Placeholder Whisper integration.

    In production you would stream to Whisper or another ASR model. We keep a
    lightweight approximation so the rest of the orchestration can run without
    GPU dependencies.
    """

    if not upload:
        return 'No audio provided. Using agent memory + repo signals only.'

    content = await upload.read()
    seconds = max(1, len(content) // 16000)
    minutes = seconds / 60
    return (
        f"Transcription placeholder for {upload.filename} (~{minutes:.1f} min). "
        'Detected agenda: infra readiness, QA, and polish.'
    )
