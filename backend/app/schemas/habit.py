from datetime import datetime, date

from pydantic import BaseModel, Field


class TodoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    notes: str = Field(default="", max_length=2000)
    priority: str = Field(default="medium", pattern="^(low|medium|high)$")
    due_date: date | None = None


class TodoUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    notes: str | None = Field(default=None, max_length=2000)
    priority: str | None = Field(default=None, pattern="^(low|medium|high)$")
    due_date: date | None = None


class TodoOut(BaseModel):
    id: int
    title: str
    notes: str
    priority: str
    completed: bool
    completed_at: datetime | None
    exp_awarded: int
    due_date: date | None
    created_at: datetime

    class Config:
        from_attributes = True


class ToggleResponse(BaseModel):
    todo: TodoOut
    exp_delta: int
    # Snapshot of stats after the toggle so the UI can animate the change.
    total_exp: int
    level: int
    current_streak: int
    multiplier: float
    leveled_up: bool
