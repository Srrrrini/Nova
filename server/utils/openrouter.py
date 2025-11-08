from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

import httpx

OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
DEFAULT_MODEL = os.getenv('OPENROUTER_DEFAULT_MODEL', 'anthropic/claude-3.5-sonnet')


class OpenRouterClient:
    """Thin helper that gracefully falls back to mock responses locally."""

    def __init__(self, api_key: Optional[str] = None, model: str = DEFAULT_MODEL) -> None:
        self.api_key = api_key or os.getenv('OPENROUTER_API_KEY')
        self.model = model

    async def chat(self, messages: List[Dict[str, str]], model: Optional[str] = None, **kwargs: Any) -> str:
        if not self.api_key:
            return self._offline_stub(messages)

        payload = {
            'model': model or self.model,
            'messages': messages,
            **({'temperature': kwargs['temperature']} if 'temperature' in kwargs else {})
        }

        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'HTTP-Referer': os.getenv('OPENROUTER_SITE_URL', 'http://localhost'),
            'X-Title': os.getenv('OPENROUTER_APP_NAME', 'Agentic Planner')
        }

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(OPENROUTER_URL, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            return data['choices'][0]['message']['content']

    def _offline_stub(self, messages: List[Dict[str, str]]) -> str:
        last_prompt = messages[-1]['content'] if messages else ''
        return (
            'Offline mode: estimated dependencies and risks synthesized for prompt. '
            f'Summary seed: {last_prompt[:160]}...'
        )
