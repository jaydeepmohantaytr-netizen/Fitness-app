"""Registration, login, and the current-user (`/me`) endpoint."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, UserStats
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    MeResponse,
    UserOut,
    StatsOut,
)
from app.services.exp_engine import level_progress

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _me_payload(user: User) -> MeResponse:
    stats = user.stats
    prog = level_progress(stats.total_exp)
    return MeResponse(
        user=UserOut.model_validate(user),
        stats=StatsOut(
            total_exp=stats.total_exp,
            level=stats.level,
            current_streak=stats.current_streak,
            longest_streak=stats.longest_streak,
            multiplier=stats.multiplier,
            exp_into_level=prog["exp_into_level"],
            exp_for_next_level=prog["exp_for_next_level"],
        ),
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    exists = db.scalar(
        select(User).where(
            (User.username == body.username) | (User.email == body.email)
        )
    )
    if exists:
        raise HTTPException(status_code=409, detail="Username or email already taken")

    # Bootstrap: the very first account becomes the admin/supervisor.
    user_count = db.scalar(select(func.count()).select_from(User)) or 0
    role = "admin" if user_count == 0 else "user"

    user = User(
        username=body.username,
        email=body.email,
        display_name=body.display_name or body.username,
        password_hash=hash_password(body.password),
        role=role,
    )
    user.stats = UserStats()
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.username == body.username))
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=MeResponse)
def me(user: User = Depends(get_current_user)):
    return _me_payload(user)
