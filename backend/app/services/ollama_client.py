"""Thin synchronous client for a local Ollama server."""
import json
from typing import Any

import httpx

from app.core.config import settings


class OllamaError(RuntimeError):
    pass


def chat_json(
    system: str,
    user: str,
    schema: dict[str, Any] | None = None,
    temperature: float = 0.6,
    model: str | None = None,
) -> dict[str, Any]:
    """Call Ollama's chat endpoint and return parsed JSON content.

    When `schema` is provided it is passed as Ollama's structured-output
    `format`, which constrains the model to emit JSON matching the schema.
    """
    payload: dict[str, Any] = {
        "model": model or settings.ollama_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "stream": False,
        "options": {"temperature": temperature},
    }
    if schema is not None:
        payload["format"] = schema

    try:
        with httpx.Client(timeout=settings.ollama_timeout_seconds) as client:
            resp = client.post(
                f"{settings.ollama_base_url}/api/chat", json=payload
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as exc:
        raise OllamaError(f"Ollama request failed: {exc}") from exc

    content = data.get("message", {}).get("content", "").strip()
    if not content:
        raise OllamaError("Ollama returned an empty response")
    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise OllamaError(f"Ollama returned invalid JSON: {content[:200]}") from exc


def is_available() -> bool:
    try:
        with httpx.Client(timeout=2.0) as client:
            return client.get(f"{settings.ollama_base_url}/api/tags").status_code == 200
    except httpx.HTTPError:
        return False
