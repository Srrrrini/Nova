from __future__ import annotations

import asyncio
import json
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any, Dict


async def inspect_repository(repo_url: str) -> Dict[str, Any]:
    if not repo_url:
        return _fallback_summary('Missing repository URL')

    try:
        return await asyncio.to_thread(_clone_and_summarize, repo_url)
    except Exception as exc:  # pragma: no cover - best effort only
        return _fallback_summary(str(exc))


def _clone_and_summarize(repo_url: str) -> Dict[str, Any]:
    workdir = Path(tempfile.mkdtemp(prefix='agentic-repo-'))
    summary: Dict[str, Any] = {
        'readme_excerpt': '',
        'directories': [],
        'issues': [],
        'commits': [],
        'source': repo_url,
    }
    try:
        subprocess.run(['git', 'clone', '--depth=1', repo_url, str(workdir)], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        readme = workdir / 'README.md'
        if readme.exists():
            summary['readme_excerpt'] = readme.read_text()[:400]
        summary['directories'] = [item.name for item in workdir.iterdir() if item.is_dir()][:8]
        summary['commits'] = _git_log(workdir)
    except Exception as exc:  # pragma: no cover - network / git may fail locally
        summary['error'] = str(exc)
    finally:
        shutil.rmtree(workdir, ignore_errors=True)
    return summary


def _git_log(path: Path) -> list[str]:
    try:
        result = subprocess.run(
            ['git', '-C', str(path), '--no-pager', 'log', '-3', '--pretty=%s'],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        return [line.strip() for line in result.stdout.splitlines() if line.strip()]
    except Exception:
        return []


def _fallback_summary(reason: str) -> Dict[str, Any]:
    return {
        'readme_excerpt': 'Fallback repo summary. Unable to clone repo. Reason: ' + reason,
        'directories': ['client', 'server', 'agents'],
        'issues': ['Document API contracts', 'Add integration tests'],
        'commits': ['feat: add planner ui', 'chore: wire modal deploy'],
        'source': 'fallback',
        'error': reason,
    }
