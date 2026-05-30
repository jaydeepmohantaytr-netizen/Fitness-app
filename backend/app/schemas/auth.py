from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    display_name: str = Field(default="", max_length=120)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class StatsOut(BaseModel):
    total_exp: int
    level: int
    current_streak: int
    longest_streak: int
    multiplier: float
    exp_into_level: int
    exp_for_next_level: int


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    display_name: str
    role: str
    supervisor_id: int | None

    class Config:
        from_attributes = True


class MeResponse(BaseModel):
    user: UserOut
    stats: StatsOut
