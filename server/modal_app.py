from __future__ import annotations

import modal

from .main import get_app

image = (
    modal.Image.debian_slim()
    .pip_install('fastapi', 'uvicorn', 'agentuity', 'httpx', 'pydantic', 'sqlalchemy')
)

app = modal.App('agentic-planner')


@app.function(image=image, secrets=[modal.Secret.from_name('openrouter-keys')], timeout=600)
@modal.asgi_app()
def fastapi_app():
    return get_app()
