"""Food log entries and per-user daily nutrition goals."""
from datetime import datetime, date, timezone

from sqlalchemy import String, Integer, Float, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class FoodLogEntry(Base):
    __tablename__ = "food_log_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    log_date: Mapped[date] = mapped_column(Date, index=True)
    # The original free-text the user typed (the whole meal description).
    source_text: Mapped[str] = mapped_column(Text, default="")
    name: Mapped[str] = mapped_column(String(255))
    quantity: Mapped[str] = mapped_column(String(120), default="1 serving")
    calories: Mapped[int] = mapped_column(Integer, default=0)
    protein_g: Mapped[float] = mapped_column(Float, default=0.0)
    carbs_g: Mapped[float] = mapped_column(Float, default=0.0)
    fat_g: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class NutritionGoal(Base):
    __tablename__ = "nutrition_goals"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    calorie_goal: Mapped[int] = mapped_column(Integer)
    protein_goal: Mapped[float] = mapped_column(Float)
    carbs_goal: Mapped[float] = mapped_column(Float)
    fat_goal: Mapped[float] = mapped_column(Float)
