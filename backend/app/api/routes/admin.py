"""Admin / supervisor endpoints: oversee users and adjust their accounts.

Foundation scope: list users with progress, drill into a user's tasks, assign a
supervisor, and toggle a user's task on their behalf. The full admin UI is a
later phase, but the backbone is here and protected by the `admin` role.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.user import User
from app.models.habit import Todo
from app.schemas.admin import AdminUserRow, AssignSupervisorRequest
from app.schemas.auth import StatsOut
from app.schemas.habit import TodoOut
from app.services.exp_engine import level_progress

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _stats_out(user: User) -> StatsOut:
    s = user.stats
    prog = level_progress(s.total_exp)
    return StatsOut(
        total_exp=s.total_exp,
        level=s.level,
        current_streak=s.current_streak,
        longest_streak=s.longest_streak,
        multiplier=s.multiplier,
        exp_into_level=prog["exp_into_level"],
        exp_for_next_level=prog["exp_for_next_level"],
    )


@router.get("/users", response_model=list[AdminUserRow])
def list_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.scalars(select(User).order_by(User.created_at)).all()
    rows: list[AdminUserRow] = []
    for u in users:
        open_count = db.scalar(
            select(func.count())
            .select_from(Todo)
            .where(Todo.user_id == u.id, Todo.completed.is_(False))
        ) or 0
        done_count = db.scalar(
            select(func.count())
            .select_from(Todo)
            .where(Todo.user_id == u.id, Todo.completed.is_(True))
        ) or 0
        rows.append(
            AdminUserRow(
                id=u.id,
                username=u.username,
                display_name=u.display_name,
                email=u.email,
                role=u.role,
                supervisor_id=u.supervisor_id,
                created_at=u.created_at,
                stats=_stats_out(u),
                open_tasks=open_count,
                completed_tasks=done_count,
            )
        )
    return rows


@router.get("/users/{user_id}/todos", response_model=list[TodoOut])
def user_todos(
    user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)
):
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    return db.scalars(
        select(Todo).where(Todo.user_id == user_id).order_by(Todo.created_at.desc())
    ).all()


@router.put("/users/{user_id}/supervisor", response_model=AdminUserRow)
def assign_supervisor(
    user_id: int,
    body: AssignSupervisorRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if body.supervisor_id is not None:
        sup = db.get(User, body.supervisor_id)
        if not sup:
            raise HTTPException(status_code=404, detail="Supervisor not found")
    target.supervisor_id = body.supervisor_id
    db.commit()
    db.refresh(target)
    open_count = db.scalar(
        select(func.count()).select_from(Todo).where(
            Todo.user_id == target.id, Todo.completed.is_(False)
        )
    ) or 0
    done_count = db.scalar(
        select(func.count()).select_from(Todo).where(
            Todo.user_id == target.id, Todo.completed.is_(True)
        )
    ) or 0
    return AdminUserRow(
        id=target.id,
        username=target.username,
        display_name=target.display_name,
        email=target.email,
        role=target.role,
        supervisor_id=target.supervisor_id,
        created_at=target.created_at,
        stats=_stats_out(target),
        open_tasks=open_count,
        completed_tasks=done_count,
    )
