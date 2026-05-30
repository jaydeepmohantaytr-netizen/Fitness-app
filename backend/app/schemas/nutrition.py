from datetime import date

from pydantic import BaseModel, Field


class ParseRequest(BaseModel):
    text: str = Field(min_length=1, max_length=1000)


class FoodItem(BaseModel):
    name: str = Field(max_length=255)
    quantity: str = Field(default="1 serving", max_length=120)
    calories: int = Field(default=0, ge=0)
    protein_g: float = Field(default=0, ge=0)
    carbs_g: float = Field(default=0, ge=0)
    fat_g: float = Field(default=0, ge=0)


class ParseResponse(BaseModel):
    items: list[FoodItem]
    source: str  # 'ai' or 'fallback'


class EntryCreate(BaseModel):
    log_date: date
    source_text: str = Field(default="", max_length=1000)
    items: list[FoodItem]


class FoodEntryOut(BaseModel):
    id: int
    log_date: date
    source_text: str
    name: str
    quantity: str
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float

    class Config:
        from_attributes = True


class DayTotals(BaseModel):
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float


class GoalsOut(BaseModel):
    calorie_goal: int
    protein_goal: float
    carbs_goal: float
    fat_goal: float


class GoalsUpdate(BaseModel):
    calorie_goal: int = Field(ge=500, le=10000)
    protein_goal: float = Field(ge=0, le=1000)
    carbs_goal: float = Field(ge=0, le=2000)
    fat_goal: float = Field(ge=0, le=1000)


class DayResponse(BaseModel):
    log_date: date
    entries: list[FoodEntryOut]
    totals: DayTotals
    goals: GoalsOut


class SaveResponse(BaseModel):
    entries: list[FoodEntryOut]
    totals: DayTotals
    exp_delta: int
    total_exp: int
    level: int
    current_streak: int
    multiplier: float
    leveled_up: bool
