from __future__ import annotations

import os
import tempfile
from typing import Optional

import httpx
from fastapi import UploadFile


_LANGUAGE = os.getenv("TRANSCRIPT_LANGUAGE", "en").strip() or None


async def transcribe_upload(file: UploadFile) -> str:
    """
    Transcribe an uploaded audio file using OpenAI's Whisper API via OpenRouter or Groq.
    
    Falls back to a local faster-whisper model if API keys are not configured.
    """

    raw = await file.read()
    if not raw:
        return ""

    # Try OpenRouter first (if OPENROUTER_API_KEY is set)
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if openrouter_key:
        try:
            transcript = await _transcribe_with_openrouter(raw, file.filename, openrouter_key)
            if transcript:
                return transcript
        except Exception as exc:
            print(f"[transcription] OpenRouter failed: {exc}, trying fallback...")

    # Try Groq as fallback (free tier available)
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        try:
            transcript = await _transcribe_with_groq(raw, file.filename, groq_key)
            if transcript:
                return transcript
        except Exception as exc:
            print(f"[transcription] Groq failed: {exc}, trying local model...")

    # Fall back to local faster-whisper if available
    try:
        from faster_whisper import WhisperModel  # type: ignore
        transcript = await _transcribe_local(raw, file.filename)
        if transcript:
            return transcript
    except ImportError:
        pass
    except Exception as exc:
        print(f"[transcription] Local whisper failed: {exc}")

    return (
        "Transcription unavailable; "
        f"{len(raw)} bytes captured. "
        "Configure OPENROUTER_API_KEY or GROQ_API_KEY for automatic transcription."
    )


async def _transcribe_with_openrouter(audio_data: bytes, filename: Optional[str], api_key: str) -> str:
    """Transcribe using OpenAI's Whisper via OpenRouter"""
    url = "https://api.openai.com/v1/audio/transcriptions"
    
    suffix = _detect_extension(filename)
    headers = {"Authorization": f"Bearer {api_key}"}
    
    # Create multipart form data
    files = {
        "file": (f"audio{suffix}", audio_data, "audio/mpeg"),
        "model": (None, "whisper-1"),
    }
    if _LANGUAGE:
        files["language"] = (None, _LANGUAGE)
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(url, headers=headers, files=files)
        
        if response.status_code == 200:
            data = response.json()
            return data.get("text", "").strip()
        else:
            raise Exception(f"OpenRouter transcription failed: {response.status_code} - {response.text}")


async def _transcribe_with_groq(audio_data: bytes, filename: Optional[str], api_key: str) -> str:
    """Transcribe using Groq's Whisper API (free tier available)"""
    url = "https://api.groq.com/openai/v1/audio/transcriptions"
    
    suffix = _detect_extension(filename)
    headers = {"Authorization": f"Bearer {api_key}"}
    
    # Create multipart form data
    files = {
        "file": (f"audio{suffix}", audio_data, "audio/mpeg"),
        "model": (None, "whisper-large-v3"),
    }
    if _LANGUAGE:
        files["language"] = (None, _LANGUAGE)
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(url, headers=headers, files=files)
        
        if response.status_code == 200:
            data = response.json()
            return data.get("text", "").strip()
        else:
            raise Exception(f"Groq transcription failed: {response.status_code} - {response.text}")


async def _transcribe_local(audio_data: bytes, filename: Optional[str]) -> str:
    """Transcribe using local faster-whisper model"""
    from faster_whisper import WhisperModel  # type: ignore
    
    model = WhisperModel("small", device="cpu", compute_type="int8")
    suffix = _detect_extension(filename)
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(audio_data)
        tmp.flush()
        temp_path = tmp.name
    
    try:
        segments, _ = model.transcribe(
            temp_path,
            language=_LANGUAGE,
            beam_size=5,
            condition_on_previous_text=False,
        )
        text = " ".join(segment.text.strip() for segment in segments if segment.text)
        return text.strip() if text else ""
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

