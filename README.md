# Nova

Nova is a meeting analysis and sprint planning tool that transforms meeting recordings into actionable project plans with task breakdowns, dependency graphs, and risk assessments.

## Architecture

- **Frontend** (`/client`) - React + TypeScript + TailwindCSS interface with meeting capture, task visualization, and dependency graphs
- **Backend** (`/backend`) - FastAPI service with audio transcription, LLM-based planning, and structured plan generation
- **Storage** - JSON file-based storage in `backend/data/plans/` for meeting analysis results

## Prerequisites

- Node.js 18+
- Python 3.11+
- OpenRouter API key (for LLM-based planning)
- GitHub token (optional, for repository code analysis)

## Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Set required environment variables:

```bash
export OPENROUTER_API_KEY="your-key-here"
export GITHUB_TOKEN="your-token-here"  # optional
```

Start the server:

```bash
uvicorn app.main:app --reload
```

API docs available at `http://127.0.0.1:8000/docs`

### Frontend

```bash
cd client
npm install
npm run dev
```

Access the UI at `http://localhost:5173`

## Usage

1. Navigate to the Home page
2. Start a meeting recording or use the default audio sample
3. Click "Analyze meeting" to process the audio
4. View the generated sprint plan with:
   - Executive summary
   - Risk assessments
   - Milestone-based task breakdown
   - Files requiring changes
   - Task dependencies

## Features

- Audio transcription with Whisper API
- LLM-based sprint planning using OpenRouter
- GitHub repository code search for context
- Structured task generation with owners and estimates
- Dependency graph visualization
- Risk and constraint identification
- Meeting minutes with formatted output

## Project Structure

```
Nova/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── schemas.py           # Pydantic models
│   │   ├── repository.py        # Data persistence
│   │   └── services/            # Business logic
│   └── data/plans/              # Stored meeting analyses
├── client/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Page layouts
│   │   ├── hooks/               # Custom React hooks
│   │   ├── types/               # TypeScript types
│   │   └── utils/               # Helper functions
│   └── public/                  # Static assets
└── docs/                        # Documentation

```

## API Endpoints

- `POST /api/v1/meetings/analyze` - Analyze meeting audio with context
- `GET /api/v1/meetings/{meetingId}/plan` - Retrieve existing plan
- `GET /api/v1/health` - Health check

## Configuration

Environment variables for the backend:

- `OPENROUTER_API_KEY` - Required for LLM planning
- `OPENROUTER_MODEL` - Default model (optional)
- `OPENROUTER_BASE_URL` - API endpoint (optional)
- `OPENROUTER_TIMEOUT` - Request timeout in seconds (optional)
- `GITHUB_TOKEN` - For repository code search (optional)

Environment variables for the frontend:

- `VITE_API_BASE_URL` - Backend API URL (default: `/api/v1`)

## Development

Run tests:

```bash
# Backend
cd backend
pytest

# Frontend
cd client
npm test
```

Build for production:

```bash
# Frontend
cd client
npm run build
```

## Documentation

See the `docs/` directory for detailed documentation:

- `backend-design.md` - Backend architecture and API design
- `frontend-improvements.md` - Recent UI enhancements
- `agentuity-agents.md` - Agent orchestration details

## License

See LICENSE file for details.
