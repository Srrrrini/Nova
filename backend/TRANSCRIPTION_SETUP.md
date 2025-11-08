# Audio Transcription Setup

The backend now supports three methods for audio transcription:

## 1. Using OpenRouter (Recommended if you already have an API key)

The transcription service will automatically use your existing `OPENROUTER_API_KEY` to transcribe audio through OpenAI's Whisper API.

**No additional setup needed!** Just use your existing OpenRouter key.

## 2. Using Groq (Free Option)

Groq offers free Whisper API access with generous limits.

1. Sign up at https://console.groq.com/
2. Create an API key
3. Add to your `.env` file:
   ```
   GROQ_API_KEY=gsk_...
   ```

## 3. Local Whisper (Fallback)

If neither API key is configured, the system will attempt to use a local `faster-whisper` model.

Install with:
```bash
pip install faster-whisper
```

## How it Works

The transcription service tries methods in this order:
1. **OpenRouter** (if `OPENROUTER_API_KEY` is set) → OpenAI Whisper-1
2. **Groq** (if `GROQ_API_KEY` is set) → Whisper-large-v3 (free)
3. **Local** (if `faster-whisper` is installed) → Whisper-small
4. **Fallback** → Returns a message that transcription is unavailable

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

