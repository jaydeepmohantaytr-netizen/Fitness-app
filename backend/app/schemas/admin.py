from datetime import datetime

from pydantic import BaseModel

from app.schemas.auth import StatsOut


class AdminUserRow(BaseModel):
    id: int
    username: str
    display_name: str
    email: str
    role: str
    supervisor_id: int | None
    created_at: datetime
    stats: StatsOut
    open_tasks: int
    completed_tasks: int


class AssignSupervisorRequest(BaseModel):
    supervisor_id: int | None
