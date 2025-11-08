from __future__ import annotations

import os
import tempfile
from typing import Optional

from fastapi import UploadFile

try:
    from faster_whisper import WhisperModel  # type: ignore
except ImportError:
    WhisperModel = None  # type: ignore


_WHISPER_MODEL: Optional["WhisperModel"] = None
_LANGUAGE = os.getenv("TRANSCRIPT_LANGUAGE", "en").strip() or None


def _get_whisper_model() -> Optional["WhisperModel"]:
    """Get or initialize the Whisper model (singleton)"""
    global _WHISPER_MODEL
    if WhisperModel is None:
        return None
    if _WHISPER_MODEL is None:
        print("[transcription] Loading faster-whisper model (small)...")
        _WHISPER_MODEL = WhisperModel("small", device="cpu", compute_type="int8")
        print("[transcription] Model loaded successfully")
    return _WHISPER_MODEL


async def transcribe_upload(file: UploadFile) -> str:
    """
    Transcribe an uploaded audio file using faster-whisper (local Whisper model).
    """

    raw = await file.read()
    if not raw:
        print("[transcription] No audio data received")
        return ""

    print(f"[transcription] Received {len(raw)} bytes from file: {file.filename}")
    
    model = _get_whisper_model()
    if model is None:
        return (
            f"Transcription unavailable: faster-whisper not installed. "
            f"Received {len(raw)} bytes. Install with: pip install faster-whisper"
        )

    # Save to temporary file
    suffix = _detect_extension(file.filename)
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(raw)
        tmp.flush()
        temp_path = tmp.name
    
    print(f"[transcription] Saved to temp file: {temp_path}")
    
    try:
        print(f"[transcription] Starting transcription (language={_LANGUAGE})...")
        segments, info = model.transcribe(
            temp_path,
            language=_LANGUAGE,
            beam_size=5,
            condition_on_previous_text=False,
        )
        
        print(f"[transcription] Audio duration: {info.duration:.2f}s, language: {info.language}")
        
        text_parts = []
        for segment in segments:
            if segment.text:
                text_parts.append(segment.text.strip())
        
        text = " ".join(text_parts)
        print(f"[transcription] Transcription complete: {len(text)} characters")
        
        if text:
            return text.strip()
        else:
            return "No speech detected in audio"
            
    except Exception as exc:
        print(f"[transcription] Error during transcription: {exc}")
        return f"Transcription failed: {exc}"
    finally:
        try:
            os.unlink(temp_path)
        except OSError:
            pass


def _detect_extension(filename: Optional[str]) -> str:
    if not filename:
        return ".wav"
    base, ext = os.path.splitext(filename)
    if ext:
        return ext
    return ".wav"

