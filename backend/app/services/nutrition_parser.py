"""Parse a free-text meal description into structured food items with estimated
macros, using the local Ollama model. Falls back to a single un-estimated item
so the user can fill in values manually when the AI is unavailable."""
from typing import Any

from app.services import ollama_client

NUTRITION_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "quantity": {"type": "string"},
                    "calories": {"type": "integer"},
                    "protein_g": {"type": "number"},
                    "carbs_g": {"type": "number"},
                    "fat_g": {"type": "number"},
                },
                "required": ["name", "quantity", "calories", "protein_g", "carbs_g", "fat_g"],
            },
        }
    },
    "required": ["items"],
}

SYSTEM_PROMPT = (
    "You are a meticulous nutrition assistant. Given a free-text description of a "
    "meal, break it into individual food items. For EACH item estimate the nutrition "
    "for the quantity actually eaten: calories (kcal), protein, carbohydrates, and fat "
    "in grams. Use realistic, commonly-cited values. If a quantity isn't stated, assume "
    "one typical serving and say so in 'quantity'. Return ONLY JSON matching the schema."
)


def _sanitize(data: dict[str, Any]) -> list[dict[str, Any]]:
    items = []
    for it in (data.get("items") or [])[:25]:
        name = str(it.get("name", "")).strip()
        if not name:
            continue
        items.append(
            {
                "name": name[:255],
                "quantity": str(it.get("quantity", "1 serving"))[:120],
                "calories": max(0, int(round(float(it.get("calories", 0) or 0)))),
                "protein_g": round(max(0.0, float(it.get("protein_g", 0) or 0)), 1),
                "carbs_g": round(max(0.0, float(it.get("carbs_g", 0) or 0)), 1),
                "fat_g": round(max(0.0, float(it.get("fat_g", 0) or 0)), 1),
            }
        )
    return items


def parse_meal(text: str) -> tuple[list[dict[str, Any]], str]:
    """Returns (items, source) where source is 'ai' or 'fallback'."""
    try:
        raw = ollama_client.chat_json(
            system=SYSTEM_PROMPT,
            user=f"Meal description: {text}",
            schema=NUTRITION_SCHEMA,
            temperature=0.3,
        )
        items = _sanitize(raw)
        if items:
            return items, "ai"
    except ollama_client.OllamaError:
        pass

    # Fallback: one placeholder item with the raw text, zeroed macros to edit.
    return (
        [
            {
                "name": text.strip()[:255] or "Food item",
                "quantity": "1 serving",
                "calories": 0,
                "protein_g": 0.0,
                "carbs_g": 0.0,
                "fat_g": 0.0,
            }
        ],
        "fallback",
    )
