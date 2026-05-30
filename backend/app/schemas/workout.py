from datetime import datetime

from pydantic import BaseModel, Field


class QuizRequest(BaseModel):
    goal: str = Field(max_length=64)
    experience: str = Field(pattern="^(beginner|intermediate|advanced)$")
    days_per_week: int = Field(ge=2, le=6)
    minutes_per_session: int = Field(ge=10, le=180)
    equipment: list[str] = Field(default_factory=list)
    focus: str = Field(default="", max_length=255)
    limitations: str = Field(default="", max_length=1000)


class ExerciseOut(BaseModel):
    id: int
    order_index: int
    name: str
    sets: int
    reps: str
    rest_seconds: int
    notes: str

    class Config:
        from_attributes = True


class DayOut(BaseModel):
    id: int
    order_index: int
    name: str
    focus: str
    completed_today: bool
    exercises: list[ExerciseOut]


class PlanOut(BaseModel):
    id: int
    title: str
    summary: str
    goal: str
    experience: str
    days_per_week: int
    minutes_per_session: int
    equipment: list[str]
    focus: str
    created_at: datetime
    source: str  # 'ai' or 'fallback'
    days: list[DayOut]


class CompleteResponse(BaseModel):
    completed: bool
    exp_delta: int
    total_exp: int
    level: int
    current_streak: int
    multiplier: float
    leveled_up: bool
