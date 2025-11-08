# Backend Setup Guide

## Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```bash
# OpenRouter API Configuration (Required)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# GitHub API Token (Required for code search to work)
# Get a token at: https://github.com/settings/tokens
# Minimum required scope: 'public_repo' or 'repo' (for private repos)
GITHUB_TOKEN=your_github_personal_access_token_here

# Optional Configuration
# OPENROUTER_MODEL=openrouter/auto
# OPENROUTER_TIMEOUT=120
# TRANSCRIPT_LANGUAGE=en
```

## Getting a GitHub Token

The GitHub code search feature requires a personal access token to search your repository for relevant code.

### Steps to create a GitHub token:

1. Go to https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a descriptive name: "Nova Sprint Planner"
4. Select scopes:
   - ✅ **`public_repo`** (if your repo is public)
   - ✅ **`repo`** (if your repo is private - this gives full repo access)
5. Click **"Generate token"**
6. **Copy the token immediately** (you won't be able to see it again!)
7. Add it to your `.env` file as `GITHUB_TOKEN=ghp_xxxxxxxxxxxxx`

## How It Works

When you analyze a meeting, the backend:

1. **Extracts keywords** from the transcript
   - Example: "SQLite migration" → searches for "sqlite migration"
   
2. **Searches your GitHub repo** using the GitHub Code Search API:
   ```
   GET https://api.github.com/search/code
   ?q=sqlite+migration+repo:Srrrrini/Nova
   ```

3. **Returns file paths and code snippets**:
   ```
   Repository: Srrrrini/Nova
   - `sqlite migration` → `backend/app/repository.py` :: class PlanningRepository
   - `redis caching` → (no matches)
   - `timeout handling` → `backend/app/services/openrouter_client.py`
   ```

4. **Includes this context in the OpenRouter prompt** so the AI can:
   - Suggest which specific files need changes
   - Map tasks to actual code areas
   - Make more accurate estimates based on existing code

## Without a GitHub Token

If you don't provide a `GITHUB_TOKEN`, the code search will:
- Hit rate limits quickly (60 requests/hour)
- May fail with 401/403 errors
- Return "No repository context available" in the prompt

The sprint planning will still work, but the AI won't have specific code context from your repository.

## Current Configuration

Your app is configured to search: **https://github.com/Srrrrini/Nova**

This will search in:
- `backend/` - FastAPI service
- `client/` - React frontend
- `server/` - Additional server code
- `docs/` - Documentation

## Testing

To verify your GitHub token works:

```bash
cd backend
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
python -c "
from app.services.github_search import GitHubCodeSearcher
searcher = GitHubCodeSearcher()
result = searcher.gather_context('https://github.com/Srrrrini/Nova', 'sqlite repository')
print(result)
"
```

You should see file paths from your repo!

