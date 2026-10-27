from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, model_validator, ConfigDict

class LogBase(BaseModel):
    habit_id: str
    date: Optional[str] = None
    local_date: Optional[str] = None
    completed: bool = False
    current_value: float = 0.0
    completion_value: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = ""
    client_operation_id: Optional[str] = None
    completed_at: Optional[str] = None

    @model_validator(mode="after")
    def sync_log_aliases(self):
        if not self.local_date and self.date:
            self.local_date = self.date
        elif not self.date and self.local_date:
            self.date = self.local_date
        elif not self.date and not self.local_date:
            today_str = date.today().isoformat()
            self.date = today_str
            self.local_date = today_str

        if self.completion_value is None:
            self.completion_value = self.current_value
        else:
            self.current_value = self.completion_value

        if not self.status:
            self.status = "completed" if self.completed else "partial"
        return self

class LogCreate(LogBase):
    id: Optional[str] = None

class ToggleRequest(BaseModel):
    date: str
    current_value: Optional[float] = None
    notes: Optional[str] = None
    client_operation_id: Optional[str] = None

class LogResponse(BaseModel):
    id: str
    habit_id: str
    date: str
    local_date: str
    completed: bool
    current_value: float
    completion_value: float
    status: str = "completed"
    notes: Optional[str] = ""
    client_operation_id: Optional[str] = None
    completed_at: Optional[str] = None
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)

def completion_to_response(comp) -> LogResponse:
    """Transform HabitCompletion ORM model into LogResponse."""
    d_str = comp.local_date.isoformat() if isinstance(comp.local_date, (date, datetime)) else str(comp.local_date)
    is_done = (comp.status == "completed")
    c_at = comp.created_at.isoformat() if isinstance(comp.created_at, (date, datetime)) else str(comp.created_at or datetime.utcnow().isoformat())
    u_at = comp.updated_at.isoformat() if isinstance(comp.updated_at, (date, datetime)) else str(comp.updated_at or datetime.utcnow().isoformat())

    return LogResponse(
        id=str(comp.id),
        habit_id=str(comp.habit_id),
        date=d_str,
        local_date=d_str,
        completed=is_done,
        current_value=float(comp.completion_value or 0.0),
        completion_value=float(comp.completion_value or 0.0),
        status=comp.status or ("completed" if is_done else "partial"),
        notes=comp.notes or "",
        client_operation_id=comp.client_operation_id,
        completed_at=c_at if is_done else None,
        created_at=c_at,
        updated_at=u_at
    )
