from __future__ import annotations

import os
import re
from dataclasses import dataclass
from typing import Any, Iterable, List, Optional
from urllib.parse import urlparse

import httpx


STOPWORDS = {
    "a",
    "an",
    "and",
    "for",
    "from",
    "in",
    "of",
    "on",
    "the",
    "to",
    "with",
    "fix",
    "update",
    "add",
    "implement",
    "improve",
    "create",
    "review",
}


@dataclass
class CodeReference:
    path: str
    fragment: Optional[str]


class GitHubCodeSearcher:
    """
    Lightweight helper that queries the GitHub code search API for relevant files.
    """

    def __init__(self, token: Optional[str] = None) -> None:
        self._token = token or os.getenv("GITHUB_TOKEN")

    def gather_context(
        self,
        repository_url: Optional[str],
        action_items: str,
        *,
        max_queries: int = 3,
        per_query: int = 2,
    ) -> str:
        owner_repo = self._extract_owner_repo(repository_url)
        if not owner_repo:
            return "No GitHub repository context available."

        owner, repo = owner_repo
        queries = self._extract_queries(action_items, max_queries)
        if not queries:
            return f"Repository: {owner}/{repo} (no specific queries derived from action items)."

        results: list[str] = [f"Repository: {owner}/{repo}"]
        for query in queries:
            matches = self._search(owner, repo, query, per_page=per_query)
            if not matches:
                results.append(f"- `{query}` → (no matches)")
                continue
            for match in matches:
                snippet = match.fragment.replace("\n", " ") if match.fragment else ""
                snippet = snippet.strip()
                preview = f" :: {snippet}" if snippet else ""
                results.append(f"- `{query}` → `{match.path}`{preview}")

        return "\n".join(results)

    # --- Internals ------------------------------------------------------- #

    def _extract_owner_repo(self, repository_url: Optional[Any]) -> Optional[tuple[str, str]]:
        if not repository_url:
            return None
        url_str = str(repository_url)
        parsed = urlparse(url_str)
        if "github.com" not in (parsed.netloc or ""):
            return None
        path_parts = [p for p in parsed.path.strip("/").split("/") if p]
        if len(path_parts) < 2:
            return None
        owner, repo = path_parts[0], path_parts[1].rstrip(".git")
        return owner, repo

    def _extract_queries(self, action_items: str, max_queries: int) -> List[str]:
        lines = [
            line.strip(" -•")
            for line in action_items.splitlines()
            if line.strip()
        ]
        queries: list[str] = []
        for line in lines:
            words = re.findall(r"[a-zA-Z0-9_/.-]+", line.lower())
            filtered = [w for w in words if w not in STOPWORDS]
            if not filtered:
                continue
            queries.append(" ".join(filtered[:2]))
            if len(queries) >= max_queries:
                break
        return queries

    def _search(self, owner: str, repo: str, query: str, *, per_page: int) -> List[CodeReference]:
        headers = {
            "Accept": "application/vnd.github.text-match+json",
        }
        if self._token:
            headers["Authorization"] = f"Bearer {self._token}"
        params = {
            "q": f"{query} repo:{owner}/{repo}",
            "per_page": per_page,
        }
        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.get(
                    "https://api.github.com/search/code",
                    params=params,
                    headers=headers,
                )
            if response.status_code >= 400:
                return []
            data = response.json()
        except Exception:
            return []

        matches: list[CodeReference] = []
        for item in data.get("items", []):
            path = item.get("path")
            text_matches = item.get("text_matches") or []
            fragment = None
            if text_matches:
                fragment = text_matches[0].get("fragment")
            if path:
                matches.append(CodeReference(path=path, fragment=fragment))
        return matches


