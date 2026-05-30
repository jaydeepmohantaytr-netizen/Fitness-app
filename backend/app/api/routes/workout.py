"""Workout endpoints: take the quiz, generate/store a plan, log completions."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.config import settings
from app.models.user import User
from app.models.workout import (
    WorkoutPlan,
    WorkoutDay,
    WorkoutExercise,
    WorkoutLog,
)
from app.schemas.workout import QuizRequest, PlanOut, DayOut, ExerciseOut, CompleteResponse
from app.services import exp_engine, workout_generator
from app.services.ollama_client import is_available

router = APIRouter(prefix="/api/workout", tags=["workout"])


def _serialize_plan(plan: WorkoutPlan, completed_day_ids: set[int], source: str) -> PlanOut:
    return PlanOut(
        id=plan.id,
        title=plan.title,
        summary=plan.summary,
        goal=plan.goal,
        experience=plan.experience,
        days_per_week=plan.days_per_week,
        minutes_per_session=plan.minutes_per_session,
        equipment=[e for e in plan.equipment.split(",") if e],
        focus=plan.focus,
        created_at=plan.created_at,
        source=source,
        days=[
            DayOut(
                id=d.id,
                order_index=d.order_index,
                name=d.name,
                focus=d.focus,
                completed_today=d.id in completed_day_ids,
                exercises=[ExerciseOut.model_validate(ex) for ex in d.exercises],
            )
            for d in plan.days
        ],
    )


def _load_active_plan(db: Session, user_id: int) -> WorkoutPlan | None:
    return db.scalar(
        select(WorkoutPlan)
        .where(WorkoutPlan.user_id == user_id, WorkoutPlan.is_active.is_(True))
        .options(selectinload(WorkoutPlan.days).selectinload(WorkoutDay.exercises))
        .order_by(WorkoutPlan.created_at.desc())
    )


def _completed_today(db: Session, user_id: int) -> set[int]:
    today = datetime.now(timezone.utc).date()
    rows = db.scalars(
        select(WorkoutLog.day_id).where(
            WorkoutLog.user_id == user_id, WorkoutLog.log_date == today
        )
    ).all()
    return set(rows)


@router.get("/status")
def status():
    """Lets the UI tell the user whether AI generation is available."""
    return {"ollama_available": is_available(), "model": settings.ollama_model}


@router.get("/plan", response_model=PlanOut | None)
def get_plan(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = _load_active_plan(db, user.id)
    if not plan:
        return None
    return _serialize_plan(plan, _completed_today(db, user.id), "stored")


@router.post("/generate", response_model=PlanOut, status_code=201)
def generate(
    quiz: QuizRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan_data, source = workout_generator.generate_plan(quiz.model_dump())

    # Deactivate any previous active plans for this user.
    db.execute(
        update(WorkoutPlan)
        .where(WorkoutPlan.user_id == user.id, WorkoutPlan.is_active.is_(True))
        .values(is_active=False)
    )

    plan = WorkoutPlan(
        user_id=user.id,
        goal=quiz.goal,
        experience=quiz.experience,
        days_per_week=quiz.days_per_week,
        minutes_per_session=quiz.minutes_per_session,
        equipment=",".join(quiz.equipment),
        focus=quiz.focus,
        limitations=quiz.limitations,
        title=plan_data["title"],
        summary=plan_data["summary"],
    )
    for di, d in enumerate(plan_data["days"]):
        day = WorkoutDay(order_index=di, name=d["name"], focus=d.get("focus", ""))
        for ei, ex in enumerate(d["exercises"]):
            day.exercises.append(
                WorkoutExercise(
                    order_index=ei,
                    name=ex["name"],
                    sets=ex["sets"],
                    reps=ex["reps"],
                    rest_seconds=ex["rest_seconds"],
                    notes=ex.get("notes", ""),
                )
            )
        plan.days.append(day)

    db.add(plan)
    db.commit()
    db.refresh(plan)
    return _serialize_plan(plan, set(), source)


@router.delete("/plan", status_code=204)
def delete_plan(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = _load_active_plan(db, user.id)
    if plan:
        db.delete(plan)
        db.commit()


@router.post("/days/{day_id}/toggle", response_model=CompleteResponse)
def toggle_day(
    day_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a workout day done for today (awards EXP) or undo it (revokes EXP)."""
    day = db.get(WorkoutDay, day_id)
    if not day:
        raise HTTPException(status_code=404, detail="Workout day not found")
    plan = db.get(WorkoutPlan, day.plan_id)
    if not plan or plan.user_id != user.id:
        raise HTTPException(status_code=404, detail="Workout day not found")

    today = datetime.now(timezone.utc).date()
    stats = user.stats
    level_before = stats.level

    existing = db.scalar(
        select(WorkoutLog).where(
            WorkoutLog.user_id == user.id,
            WorkoutLog.day_id == day_id,
            WorkoutLog.log_date == today,
        )
    )

    if existing:
        exp_engine.revoke_exp(stats, existing.exp_awarded)
        exp_delta = -existing.exp_awarded
        db.delete(existing)
        completed = False
    else:
        awarded = exp_engine.award_amount(stats, settings.base_exp_per_workout, today)
        exp_delta = awarded
        db.add(
            WorkoutLog(
                user_id=user.id,
                plan_id=plan.id,
                day_id=day_id,
                log_date=today,
                exp_awarded=awarded,
            )
        )
        completed = True

    db.commit()
    db.refresh(stats)

    return CompleteResponse(
        completed=completed,
        exp_delta=exp_delta,
        total_exp=stats.total_exp,
        level=stats.level,
        current_streak=stats.current_streak,
        multiplier=stats.multiplier,
        leveled_up=stats.level > level_before,
    )
