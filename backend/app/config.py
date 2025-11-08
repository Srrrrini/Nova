from __future__ import annotations

from functools import cache
from pathlib import Path
from typing import Any, Dict, Optional

import yaml

_DEFAULT_CONFIG_PATH = Path(__file__).resolve().parent.parent / "agentuity_config.yaml"


@cache
def load_agentuity_config(path: Optional[str] = None) -> Dict[str, Any]:
    """
    Load the Agentuity configuration describing agents and workflow.

    Results are cached so repeated calls are inexpensive.
    """
    config_path = Path(path) if path else _DEFAULT_CONFIG_PATH
    if not config_path.exists():
        raise FileNotFoundError(f"Agentuity config not found at {config_path}")

    with config_path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    return data

