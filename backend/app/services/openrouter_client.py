from __future__ import annotations

import os
import time
from typing import Iterable, Optional

import httpx


class OpenRouterError(RuntimeError):
    """Raised when the OpenRouter API returns an error response."""


class OpenRouterClient:
    """
    Minimal client for the OpenRouter chat completions API.

    The client reads configuration from the environment but allows explicit
    overrides for tests. Each request is executed synchronously using httpx.
    """

    _DEFAULT_BASE_URL = "https://openrouter.ai/api/v1"
    _DEFAULT_MODEL = "openrouter/auto"

    def __init__(
        self,
        api_key: Optional[str] = None,
        *,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        timeout: float = 120.0,
        max_retries: Optional[int] = None,
    ) -> None:
        self._api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        if not self._api_key:
            raise ValueError(
                "OPENROUTER_API_KEY is required but was not provided. "
                "Set it in the environment before starting the backend."
            )

        self._base_url = (base_url or os.getenv("OPENROUTER_BASE_URL") or self._DEFAULT_BASE_URL).rstrip("/")
        self._model = model or os.getenv("OPENROUTER_MODEL") or self._DEFAULT_MODEL
        timeout_override = os.getenv("OPENROUTER_TIMEOUT")
        self._timeout = float(timeout_override) if timeout_override else timeout
        retries_override = os.getenv("OPENROUTER_RETRIES")
        self._max_retries = int(retries_override) if retries_override else (max_retries or 2)

    def complete(
        self,
        messages: Iterable[dict[str, str]],
        *,
        temperature: float = 0.7,
        max_tokens: int = 1200,
    ) -> str:
        """
        Execute a chat completion request and return the assistant message content.
        """
        url = f"{self._base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
            "X-Title": "Nova Sprint Planner",
        }
        payload = {
            "model": self._model,
            "messages": list(messages),
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        last_exc: Optional[Exception] = None
        for attempt in range(1, self._max_retries + 1):
            try:
                with httpx.Client(timeout=self._timeout) as client:
                    response = client.post(url, json=payload, headers=headers)
                break
            except (httpx.TimeoutException, httpx.RequestError) as exc:
                last_exc = exc
                if attempt == self._max_retries:
                    raise OpenRouterError(f"OpenRouter request failed after {attempt} attempts: {exc}") from exc
                sleep_for = min(4, attempt)
                time.sleep(sleep_for)
        else:  # pragma: no cover - defensive guard
            raise OpenRouterError(f"OpenRouter request failed: {last_exc}")

        if response.status_code >= 400:
            raise OpenRouterError(
                f"OpenRouter error {response.status_code}: {response.text}"
            )

        data = response.json()
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as exc:  # pragma: no cover - defensive guard
            raise OpenRouterError(f"Unexpected OpenRouter response: {data}") from exc


