"""Turn quiz answers into a structured home-workout plan via local Ollama,
with a rule-based fallback so the feature degrades gracefully."""
from typing import Any

from app.services import ollama_client

# JSON schema passed to Ollama to constrain its output.
PLAN_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "summary": {"type": "string"},
        "days": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "focus": {"type": "string"},
                    "exercises": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "sets": {"type": "integer"},
                                "reps": {"type": "string"},
                                "rest_seconds": {"type": "integer"},
                                "notes": {"type": "string"},
                            },
                            "required": ["name", "sets", "reps", "rest_seconds"],
                        },
                    },
                },
                "required": ["name", "focus", "exercises"],
            },
        },
    },
    "required": ["title", "summary", "days"],
}

SYSTEM_PROMPT = (
    "You are an expert personal trainer who designs safe, effective HOME workout "
    "plans. You only prescribe exercises that match the user's available equipment. "
    "If they have no equipment, use bodyweight movements only. Respect their time "
    "budget and any stated injuries or limitations. Return ONLY JSON matching the "
    "required schema — no extra commentary."
)


def build_user_prompt(quiz: dict[str, Any]) -> str:
    equip = ", ".join(quiz["equipment"]) if quiz["equipment"] else "none (bodyweight only)"
    lines = [
        "Design a home workout plan for this person:",
        f"- Primary goal: {quiz['goal']}",
        f"- Experience level: {quiz['experience']}",
        f"- Days available per week: {quiz['days_per_week']}",
        f"- Minutes per session: {quiz['minutes_per_session']}",
        f"- Available equipment: {equip}",
    ]
    if quiz.get("focus"):
        lines.append(f"- Focus areas: {quiz['focus']}")
    if quiz.get("limitations"):
        lines.append(f"- Injuries / limitations to work around: {quiz['limitations']}")
    lines += [
        "",
        f"Create EXACTLY {quiz['days_per_week']} workout days.",
        "Each day must have a clear name (e.g. 'Day 1 — Full Body'), a focus, and "
        "4–7 exercises with sets, a rep range or duration (as a string), rest in "
        "seconds, and a short form/technique note. Order exercises logically "
        "(compound movements first). Keep total time within the session budget. "
        "Write a short, motivating 1–2 sentence summary.",
    ]
    return "\n".join(lines)


def _sanitize(plan: dict[str, Any], expected_days: int) -> dict[str, Any]:
    days = plan.get("days") or []
    clean_days = []
    for d in days[: max(1, expected_days)]:
        exercises = []
        for ex in (d.get("exercises") or [])[:8]:
            exercises.append(
                {
                    "name": str(ex.get("name", "Exercise"))[:255],
                    "sets": int(ex.get("sets", 3) or 3),
                    "reps": str(ex.get("reps", "10"))[:64],
                    "rest_seconds": int(ex.get("rest_seconds", 60) or 60),
                    "notes": str(ex.get("notes", ""))[:500],
                }
            )
        if exercises:
            clean_days.append(
                {
                    "name": str(d.get("name", "Workout"))[:255],
                    "focus": str(d.get("focus", ""))[:255],
                    "exercises": exercises,
                }
            )
    if not clean_days:
        raise ollama_client.OllamaError("Model produced no usable days")
    return {
        "title": str(plan.get("title", "Your Home Workout Plan"))[:255],
        "summary": str(plan.get("summary", ""))[:2000],
        "days": clean_days,
    }


def generate_plan(quiz: dict[str, Any]) -> tuple[dict[str, Any], str]:
    """Returns (plan, source) where source is 'ai' or 'fallback'."""
    try:
        raw = ollama_client.chat_json(
            system=SYSTEM_PROMPT,
            user=build_user_prompt(quiz),
            schema=PLAN_SCHEMA,
        )
        return _sanitize(raw, quiz["days_per_week"]), "ai"
    except ollama_client.OllamaError:
        return _fallback_plan(quiz), "fallback"


# ---------------------------------------------------------------------------
# Deterministic fallback — a sensible bodyweight/equipment split.
# ---------------------------------------------------------------------------
_BODYWEIGHT = {
    "full": [
        ("Bodyweight Squat", 3, "12-15", 60, "Chest up, knees track over toes."),
        ("Push-up", 3, "8-15", 60, "Drop to knees if needed; keep core tight."),
        ("Reverse Lunge", 3, "10 each leg", 60, "Step back, lower under control."),
        ("Plank", 3, "30-45 sec", 45, "Straight line from head to heels."),
        ("Glute Bridge", 3, "15", 45, "Squeeze glutes at the top."),
    ],
    "upper": [
        ("Push-up", 4, "8-15", 60, "Full range, elbows ~45°."),
        ("Pike Push-up", 3, "6-12", 60, "Targets shoulders."),
        ("Chair/Bench Dips", 3, "8-12", 60, "Keep shoulders down."),
        ("Superman Hold", 3, "20-30 sec", 45, "Lift chest and legs."),
    ],
    "lower": [
        ("Bodyweight Squat", 4, "15-20", 60, "Sit back into the heels."),
        ("Reverse Lunge", 3, "10 each leg", 60, "Control the descent."),
        ("Glute Bridge", 3, "15-20", 45, "Pause at the top."),
        ("Calf Raise", 3, "20", 30, "Full stretch and squeeze."),
    ],
    "core": [
        ("Plank", 3, "30-60 sec", 45, "Brace the abs."),
        ("Dead Bug", 3, "10 each side", 45, "Low back stays flat."),
        ("Bicycle Crunch", 3, "20", 45, "Slow and controlled."),
        ("Mountain Climbers", 3, "30 sec", 45, "Quick but controlled."),
    ],
}

_SPLITS = {
    2: ["full", "full"],
    3: ["full", "upper", "lower"],
    4: ["upper", "lower", "core", "full"],
    5: ["upper", "lower", "core", "full", "upper"],
    6: ["upper", "lower", "core", "upper", "lower", "full"],
}


def _fallback_plan(quiz: dict[str, Any]) -> dict[str, Any]:
    n = max(2, min(6, int(quiz["days_per_week"])))
    split = _SPLITS.get(n, _SPLITS[3])
    labels = {"full": "Full Body", "upper": "Upper Body", "lower": "Lower Body", "core": "Core & Conditioning"}
    days = []
    for i, key in enumerate(split):
        exercises = [
            {"name": e[0], "sets": e[1], "reps": e[2], "rest_seconds": e[3], "notes": e[4]}
            for e in _BODYWEIGHT[key]
        ]
        days.append(
            {"name": f"Day {i + 1} — {labels[key]}", "focus": labels[key], "exercises": exercises}
        )
    return {
        "title": f"{n}-Day Home Bodyweight Plan",
        "summary": (
            "A balanced, equipment-free starting plan. Generated offline because the "
            "AI model wasn't reachable — retake the quiz once Ollama is running for a "
            "fully personalized plan."
        ),
        "days": days,
    }
