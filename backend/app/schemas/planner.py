from datetime import datetime, date

from pydantic import BaseModel, Field


class DailyItemCreate(BaseModel):
    day: date
    start_time: str | None = Field(default=None, pattern="^([01]\\d|2[0-3]):[0-5]\\d$")
    end_time: str | None = Field(default=None, pattern="^([01]\\d|2[0-3]):[0-5]\\d$")
    title: str = Field(min_length=1, max_length=255)
    notes: str = Field(default="", max_length=2000)


class DailyItemUpdate(BaseModel):
    start_time: str | None = None
    end_time: str | None = None
    title: str | None = Field(default=None, max_length=255)
    notes: str | None = Field(default=None, max_length=2000)
    completed: bool | None = None


class DailyItemOut(BaseModel):
    id: int
    day: date
    start_time: str | None
    end_time: str | None
    title: str
    notes: str
    completed: bool

    class Config:
        from_attributes = True


class WeeklyItemCreate(BaseModel):
    week_start: date
    day_of_week: int = Field(ge=0, le=6)
    title: str = Field(min_length=1, max_length=255)
    notes: str = Field(default="", max_length=2000)


class WeeklyItemUpdate(BaseModel):
    day_of_week: int | None = Field(default=None, ge=0, le=6)
    title: str | None = Field(default=None, max_length=255)
    notes: str | None = Field(default=None, max_length=2000)
    completed: bool | None = None


class WeeklyItemOut(BaseModel):
    id: int
    week_start: date
    day_of_week: int
    title: str
    notes: str
    completed: bool

    class Config:
        from_attributes = True
