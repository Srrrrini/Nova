# Audio Transcription Setup

The backend uses **faster-whisper** (local Whisper model) for audio transcription.

## Setup

Install the faster-whisper package:

```bash
cd backend
pip install faster-whisper
```

That's it! The model will be automatically downloaded on first use.

## How it Works

- Uses Whisper **small** model running locally on CPU
- Model is loaded once and cached for subsequent transcriptions
- Supports MP3, WAV, and other common audio formats
- Language detection is automatic (or set `TRANSCRIPT_LANGUAGE=en` in `.env` to force English)

## Testing

To test transcription with your project_recording.mp3:

```bash
cd backend
python -c "
import asyncio
from app.services.transcription import transcribe_upload
from fastapi import UploadFile
import io

async def test():
    with open('../project_recording.mp3', 'rb') as f:
        audio_data = f.read()
    
    # Mock UploadFile
    class MockFile:
        def __init__(self, data, filename):
            self.file = io.BytesIO(data)
            self.filename = filename
        async def read(self):
            return self.file.read()
    
    mock_file = MockFile(audio_data, 'project_recording.mp3')
    transcript = await transcribe_upload(mock_file)
    print('Transcript:', transcript)

asyncio.run(test())
"
```

## Current Status

✅ API-based transcription (OpenRouter/Groq) will give you accurate, complete transcripts
✅ Supports MP3, WAV, and other common audio formats
✅ Automatic fallback to local processing if APIs are unavailable

