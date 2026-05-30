"""Daily and weekly planner endpoints."""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.planner import DailyPlanItem, WeeklyPlanItem
from app.schemas.planner import (
    DailyItemCreate,
    DailyItemUpdate,
    DailyItemOut,
    WeeklyItemCreate,
    WeeklyItemUpdate,
    WeeklyItemOut,
)

router = APIRouter(prefix="/api/planner", tags=["planner"])


# ----- Daily planner -------------------------------------------------------
@router.get("/daily", response_model=list[DailyItemOut])
def list_daily(
    day: date = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.scalars(
        select(DailyPlanItem)
        .where(DailyPlanItem.user_id == user.id, DailyPlanItem.day == day)
        .order_by(DailyPlanItem.start_time.is_(None), DailyPlanItem.start_time)
    ).all()
    return rows


@router.post("/daily", response_model=DailyItemOut, status_code=201)
def create_daily(
    body: DailyItemCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = DailyPlanItem(user_id=user.id, **body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/daily/{item_id}", response_model=DailyItemOut)
def update_daily(
    item_id: int,
    body: DailyItemUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.get(DailyPlanItem, item_id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="Item not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/daily/{item_id}", status_code=204)
def delete_daily(
    item_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.get(DailyPlanItem, item_id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()


# ----- Weekly planner ------------------------------------------------------
@router.get("/weekly", response_model=list[WeeklyItemOut])
def list_weekly(
    week_start: date = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.scalars(
        select(WeeklyPlanItem)
        .where(
            WeeklyPlanItem.user_id == user.id,
            WeeklyPlanItem.week_start == week_start,
        )
        .order_by(WeeklyPlanItem.day_of_week, WeeklyPlanItem.created_at)
    ).all()
    return rows


@router.post("/weekly", response_model=WeeklyItemOut, status_code=201)
def create_weekly(
    body: WeeklyItemCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = WeeklyPlanItem(user_id=user.id, **body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/weekly/{item_id}", response_model=WeeklyItemOut)
def update_weekly(
    item_id: int,
    body: WeeklyItemUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.get(WeeklyPlanItem, item_id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="Item not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/weekly/{item_id}", status_code=204)
def delete_weekly(
    item_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.get(WeeklyPlanItem, item_id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
