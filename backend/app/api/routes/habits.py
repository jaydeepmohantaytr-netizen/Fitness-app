"""To-do list CRUD plus the completion toggle that drives the EXP engine."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.habit import Todo, ExpEvent
from app.schemas.habit import TodoCreate, TodoUpdate, TodoOut, ToggleResponse
from app.services import exp_engine

router = APIRouter(prefix="/api/todos", tags=["todos"])


def _get_owned_todo(todo_id: int, user: User, db: Session) -> Todo:
    todo = db.get(Todo, todo_id)
    if not todo or todo.user_id != user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    return todo


@router.get("", response_model=list[TodoOut])
def list_todos(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.scalars(
        select(Todo)
        .where(Todo.user_id == user.id)
        .order_by(Todo.completed, Todo.created_at.desc())
    ).all()
    return rows


@router.post("", response_model=TodoOut, status_code=201)
def create_todo(
    body: TodoCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    todo = Todo(
        user_id=user.id,
        title=body.title,
        notes=body.notes,
        priority=body.priority,
        due_date=body.due_date,
    )
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


@router.patch("/{todo_id}", response_model=TodoOut)
def update_todo(
    todo_id: int,
    body: TodoUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    todo = _get_owned_todo(todo_id, user, db)
    data = body.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(todo, key, value)
    db.commit()
    db.refresh(todo)
    return todo


@router.delete("/{todo_id}", status_code=204)
def delete_todo(
    todo_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    todo = _get_owned_todo(todo_id, user, db)
    db.delete(todo)
    db.commit()


@router.post("/{todo_id}/toggle", response_model=ToggleResponse)
def toggle_todo(
    todo_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a task complete (awards EXP) or incomplete (revokes that EXP)."""
    todo = _get_owned_todo(todo_id, user, db)
    stats = user.stats
    level_before = stats.level
    exp_delta = 0

    if not todo.completed:
        today = datetime.now(timezone.utc).date()
        awarded = exp_engine.award_for_completion(stats, todo.priority, today)
        todo.completed = True
        todo.completed_at = datetime.now(timezone.utc)
        todo.exp_awarded = awarded
        exp_delta = awarded
        db.add(ExpEvent(user_id=user.id, amount=awarded, reason=f"Completed: {todo.title}"))
    else:
        exp_engine.revoke_exp(stats, todo.exp_awarded)
        exp_delta = -todo.exp_awarded
        db.add(
            ExpEvent(
                user_id=user.id,
                amount=-todo.exp_awarded,
                reason=f"Undid: {todo.title}",
            )
        )
        todo.completed = False
        todo.completed_at = None
        todo.exp_awarded = 0

    db.commit()
    db.refresh(todo)
    db.refresh(stats)

    return ToggleResponse(
        todo=TodoOut.model_validate(todo),
        exp_delta=exp_delta,
        total_exp=stats.total_exp,
        level=stats.level,
        current_streak=stats.current_streak,
        multiplier=stats.multiplier,
        leveled_up=stats.level > level_before,
    )
