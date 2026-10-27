from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class ReminderBase(BaseModel):
    habit_id: Optional[str] = None
    reminder_time: str = Field(..., pattern=r"^\d{2}:\d{2}$") # HH:MM 24h format
    days_of_week: List[int] = Field(default_factory=lambda: [0, 1, 2, 3, 4, 5, 6])
    is_enabled: bool = True
    channel: str = "in_app"

class ReminderCreate(ReminderBase):
    pass

class ReminderUpdate(BaseModel):
    habit_id: Optional[str] = None
    reminder_time: Optional[str] = None
    days_of_week: Optional[List[int]] = None
    is_enabled: Optional[bool] = None
    channel: Optional[str] = None

class ReminderResponse(ReminderBase):
    id: str
    habit_title: Optional[str] = None
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)
