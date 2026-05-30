"""Nutrition endpoints: AI meal parsing, food logging, daily totals, goals."""
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.config import settings
from app.models.user import User
from app.models.nutrition import FoodLogEntry, NutritionGoal
from app.schemas.nutrition import (
    ParseRequest,
    ParseResponse,
    EntryCreate,
    FoodEntryOut,
    DayTotals,
    DayResponse,
    GoalsOut,
    GoalsUpdate,
    SaveResponse,
)
from app.services import nutrition_parser, exp_engine
from app.services.ollama_client import is_available

router = APIRouter(prefix="/api/nutrition", tags=["nutrition"])


def _get_goals(db: Session, user_id: int) -> GoalsOut:
    g = db.get(NutritionGoal, user_id)
    if g:
        return GoalsOut(
            calorie_goal=g.calorie_goal,
            protein_goal=g.protein_goal,
            carbs_goal=g.carbs_goal,
            fat_goal=g.fat_goal,
        )
    return GoalsOut(
        calorie_goal=settings.default_calorie_goal,
        protein_goal=settings.default_protein_goal,
        carbs_goal=settings.default_carbs_goal,
        fat_goal=settings.default_fat_goal,
    )


def _totals_for_day(db: Session, user_id: int, day: date) -> DayTotals:
    row = db.execute(
        select(
            func.coalesce(func.sum(FoodLogEntry.calories), 0),
            func.coalesce(func.sum(FoodLogEntry.protein_g), 0.0),
            func.coalesce(func.sum(FoodLogEntry.carbs_g), 0.0),
            func.coalesce(func.sum(FoodLogEntry.fat_g), 0.0),
        ).where(FoodLogEntry.user_id == user_id, FoodLogEntry.log_date == day)
    ).one()
    return DayTotals(
        calories=int(row[0]),
        protein_g=round(float(row[1]), 1),
        carbs_g=round(float(row[2]), 1),
        fat_g=round(float(row[3]), 1),
    )


@router.get("/status")
def status():
    return {"ollama_available": is_available(), "model": settings.ollama_model}


@router.post("/parse", response_model=ParseResponse)
def parse(body: ParseRequest, _user: User = Depends(get_current_user)):
    """Parse free text into food items WITHOUT saving — for a review step."""
    items, source = nutrition_parser.parse_meal(body.text)
    return ParseResponse(items=items, source=source)


@router.post("/entries", response_model=SaveResponse, status_code=201)
def add_entries(
    body: EntryCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not body.items:
        raise HTTPException(status_code=400, detail="No items to log")

    # Award a small consistency bonus the first time anything is logged this day.
    already_logged_today = db.scalar(
        select(func.count())
        .select_from(FoodLogEntry)
        .where(FoodLogEntry.user_id == user.id, FoodLogEntry.log_date == body.log_date)
    ) or 0

    saved: list[FoodLogEntry] = []
    for item in body.items:
        entry = FoodLogEntry(
            user_id=user.id,
            log_date=body.log_date,
            source_text=body.source_text,
            name=item.name,
            quantity=item.quantity,
            calories=item.calories,
            protein_g=item.protein_g,
            carbs_g=item.carbs_g,
            fat_g=item.fat_g,
        )
        db.add(entry)
        saved.append(entry)

    stats = user.stats
    level_before = stats.level
    exp_delta = 0
    if already_logged_today == 0 and body.log_date == datetime.now(timezone.utc).date():
        exp_delta = exp_engine.award_amount(stats, settings.base_exp_per_meal_log, body.log_date)

    db.commit()
    for e in saved:
        db.refresh(e)
    db.refresh(stats)

    return SaveResponse(
        entries=[FoodEntryOut.model_validate(e) for e in saved],
        totals=_totals_for_day(db, user.id, body.log_date),
        exp_delta=exp_delta,
        total_exp=stats.total_exp,
        level=stats.level,
        current_streak=stats.current_streak,
        multiplier=stats.multiplier,
        leveled_up=stats.level > level_before,
    )


@router.get("/day", response_model=DayResponse)
def get_day(
    log_date: date = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entries = db.scalars(
        select(FoodLogEntry)
        .where(FoodLogEntry.user_id == user.id, FoodLogEntry.log_date == log_date)
        .order_by(FoodLogEntry.created_at)
    ).all()
    return DayResponse(
        log_date=log_date,
        entries=[FoodEntryOut.model_validate(e) for e in entries],
        totals=_totals_for_day(db, user.id, log_date),
        goals=_get_goals(db, user.id),
    )


@router.delete("/entries/{entry_id}", status_code=204)
def delete_entry(
    entry_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.get(FoodLogEntry, entry_id)
    if not entry or entry.user_id != user.id:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()


@router.get("/goals", response_model=GoalsOut)
def get_goals(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _get_goals(db, user.id)


@router.put("/goals", response_model=GoalsOut)
def update_goals(
    body: GoalsUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    g = db.get(NutritionGoal, user.id)
    if g:
        g.calorie_goal = body.calorie_goal
        g.protein_goal = body.protein_goal
        g.carbs_goal = body.carbs_goal
        g.fat_goal = body.fat_goal
    else:
        g = NutritionGoal(
            user_id=user.id,
            calorie_goal=body.calorie_goal,
            protein_goal=body.protein_goal,
            carbs_goal=body.carbs_goal,
            fat_goal=body.fat_goal,
        )
        db.add(g)
    db.commit()
    return _get_goals(db, user.id)
