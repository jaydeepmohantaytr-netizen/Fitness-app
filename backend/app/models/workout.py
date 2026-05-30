"""Workout plans generated from the fitness quiz, plus completion logs."""
from datetime import datetime, date, timezone

from sqlalchemy import (
    String,
    Integer,
    Boolean,
    DateTime,
    Date,
    ForeignKey,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class WorkoutPlan(Base):
    __tablename__ = "workout_plans"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    # Quiz inputs (kept so we can show how the plan was built / regenerate).
    goal: Mapped[str] = mapped_column(String(64))
    experience: Mapped[str] = mapped_column(String(32))
    days_per_week: Mapped[int] = mapped_column(Integer)
    minutes_per_session: Mapped[int] = mapped_column(Integer)
    equipment: Mapped[str] = mapped_column(String(255), default="")  # csv
    focus: Mapped[str] = mapped_column(String(255), default="")
    limitations: Mapped[str] = mapped_column(Text, default="")

    title: Mapped[str] = mapped_column(String(255))
    summary: Mapped[str] = mapped_column(Text, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)

    days: Mapped[list["WorkoutDay"]] = relationship(
        back_populates="plan",
        cascade="all, delete-orphan",
        order_by="WorkoutDay.order_index",
    )


class WorkoutDay(Base):
    __tablename__ = "workout_days"

    id: Mapped[int] = mapped_column(primary_key=True)
    plan_id: Mapped[int] = mapped_column(
        ForeignKey("workout_plans.id", ondelete="CASCADE"), index=True
    )
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    name: Mapped[str] = mapped_column(String(255))
    focus: Mapped[str] = mapped_column(String(255), default="")

    plan: Mapped["WorkoutPlan"] = relationship(back_populates="days")
    exercises: Mapped[list["WorkoutExercise"]] = relationship(
        back_populates="day",
        cascade="all, delete-orphan",
        order_by="WorkoutExercise.order_index",
    )


class WorkoutExercise(Base):
    __tablename__ = "workout_exercises"

    id: Mapped[int] = mapped_column(primary_key=True)
    day_id: Mapped[int] = mapped_column(
        ForeignKey("workout_days.id", ondelete="CASCADE"), index=True
    )
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    name: Mapped[str] = mapped_column(String(255))
    sets: Mapped[int] = mapped_column(Integer, default=3)
    reps: Mapped[str] = mapped_column(String(64), default="10")
    rest_seconds: Mapped[int] = mapped_column(Integer, default=60)
    notes: Mapped[str] = mapped_column(Text, default="")

    day: Mapped["WorkoutDay"] = relationship(back_populates="exercises")


class WorkoutLog(Base):
    """One row per workout day actually completed on a given date."""

    __tablename__ = "workout_logs"
    __table_args__ = (
        UniqueConstraint("user_id", "day_id", "log_date", name="uq_workout_log_day_date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    plan_id: Mapped[int] = mapped_column(
        ForeignKey("workout_plans.id", ondelete="CASCADE")
    )
    day_id: Mapped[int] = mapped_column(
        ForeignKey("workout_days.id", ondelete="CASCADE"), index=True
    )
    log_date: Mapped[date] = mapped_column(Date, index=True)
    exp_awarded: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
