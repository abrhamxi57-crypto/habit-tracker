import uuid
from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, Field, model_validator, ConfigDict

class HabitBase(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = ""
    category: str = "productivity"
    color: str = "#8b5cf6"
    icon: str = "Sparkles"
    tracking_type: Optional[str] = None
    target_type: Optional[str] = None
    target_value: float = 1.0
    unit: Optional[str] = ""
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    schedule_type: Optional[str] = None
    frequency_type: Optional[str] = None
    custom_weekdays: Optional[List[int]] = None
    custom_days: Optional[List[int]] = None
    target_days_per_week: Optional[int] = None
    weekly_target_days: Optional[int] = None
    time_of_day: str = "anytime"
    reminder_time: Optional[str] = None
    is_archived: Optional[bool] = None
    archived: Optional[bool] = None
    is_active: bool = True
    streak_freeze_count: int = 1

    @model_validator(mode="after")
    def sync_field_aliases(self):
        # Name / Title normalization
        if not self.name and self.title:
            self.name = self.title
        elif not self.title and self.name:
            self.title = self.name
        elif not self.name and not self.title:
            self.name = "Untitled Habit"
            self.title = self.name

        # Tracking / Target type normalization
        if not self.tracking_type and self.target_type:
            self.tracking_type = self.target_type
        elif not self.target_type and self.tracking_type:
            self.target_type = self.tracking_type
        else:
            self.tracking_type = self.tracking_type or "boolean"
            self.target_type = self.tracking_type

        # Schedule / Frequency type normalization
        if not self.schedule_type and self.frequency_type:
            self.schedule_type = self.frequency_type
        elif not self.frequency_type and self.schedule_type:
            self.frequency_type = self.schedule_type
        else:
            self.schedule_type = self.schedule_type or "daily"
            self.frequency_type = self.schedule_type

        # Custom weekdays normalization
        days = self.custom_weekdays if self.custom_weekdays is not None else self.custom_days
        if days is None:
            days = [0, 1, 2, 3, 4, 5, 6]
        self.custom_weekdays = days
        self.custom_days = days

        # Weekly target days normalization
        w_target = self.target_days_per_week if self.target_days_per_week is not None else self.weekly_target_days
        self.target_days_per_week = w_target if w_target is not None else 5
        self.weekly_target_days = self.target_days_per_week

        # Archived normalization
        is_arch = self.is_archived if self.is_archived is not None else self.archived
        self.is_archived = bool(is_arch)
        self.archived = self.is_archived

        return self

class HabitCreate(HabitBase):
    id: Optional[str] = None

class HabitUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    tracking_type: Optional[str] = None
    target_type: Optional[str] = None
    target_value: Optional[float] = None
    unit: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    schedule_type: Optional[str] = None
    frequency_type: Optional[str] = None
    custom_weekdays: Optional[List[int]] = None
    custom_days: Optional[List[int]] = None
    target_days_per_week: Optional[int] = None
    weekly_target_days: Optional[int] = None
    time_of_day: Optional[str] = None
    reminder_time: Optional[str] = None
    is_archived: Optional[bool] = None
    archived: Optional[bool] = None
    is_active: Optional[bool] = None
    streak_freeze_count: Optional[int] = None

class HabitResponse(BaseModel):
    id: str
    name: str
    title: str
    description: str = ""
    category: str = "productivity"
    color: str = "#8b5cf6"
    icon: str = "Sparkles"
    tracking_type: str = "boolean"
    target_type: str = "boolean"
    target_value: float = 1.0
    unit: str = ""
    start_date: str
    end_date: Optional[str] = None
    schedule_type: str = "daily"
    frequency_type: str = "daily"
    custom_weekdays: List[int] = Field(default_factory=lambda: [0, 1, 2, 3, 4, 5, 6])
    custom_days: List[int] = Field(default_factory=lambda: [0, 1, 2, 3, 4, 5, 6])
    target_days_per_week: Optional[int] = 5
    weekly_target_days: Optional[int] = 5
    is_archived: bool = False
    archived: bool = False
    is_active: bool = True
    version: int = 1
    time_of_day: str = "anytime"
    reminder_time: Optional[str] = None
    streak_freeze_count: int = 1
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)

def habit_to_response(habit) -> HabitResponse:
    """Transform Habit ORM model and related schedule into unified HabitResponse."""
    schedule = habit.schedules[0] if getattr(habit, "schedules", None) else None
    reminder = habit.reminders[0] if getattr(habit, "reminders", None) else None

    sched_type = schedule.schedule_type if schedule else "daily"
    c_weekdays = schedule.custom_weekdays if (schedule and schedule.custom_weekdays is not None) else [0, 1, 2, 3, 4, 5, 6]
    t_days = schedule.target_days_per_week if schedule else 5
    rem_time = reminder.reminder_time if reminder else None

    start_d = habit.start_date.isoformat() if isinstance(habit.start_date, (date, datetime)) else str(habit.start_date or date.today().isoformat())
    end_d = habit.end_date.isoformat() if isinstance(habit.end_date, (date, datetime)) else (str(habit.end_date) if habit.end_date else None)
    c_at = habit.created_at.isoformat() if isinstance(habit.created_at, (date, datetime)) else str(habit.created_at or datetime.utcnow().isoformat())
    u_at = habit.updated_at.isoformat() if isinstance(habit.updated_at, (date, datetime)) else str(habit.updated_at or datetime.utcnow().isoformat())

    return HabitResponse(
        id=str(habit.id),
        name=habit.name,
        title=habit.name,
        description=habit.description or "",
        category=habit.category or "productivity",
        color=habit.color or "#8b5cf6",
        icon=habit.icon or "Sparkles",
        tracking_type=habit.tracking_type or "boolean",
        target_type=habit.tracking_type or "boolean",
        target_value=float(habit.target_value or 1.0),
        unit=habit.unit or "",
        start_date=start_d,
        end_date=end_d,
        schedule_type=sched_type,
        frequency_type=sched_type,
        custom_weekdays=c_weekdays,
        custom_days=c_weekdays,
        target_days_per_week=t_days,
        weekly_target_days=t_days,
        is_archived=bool(habit.is_archived),
        archived=bool(habit.is_archived),
        is_active=bool(habit.is_active),
        version=int(habit.version or 1),
        time_of_day="anytime",
        reminder_time=rem_time,
        streak_freeze_count=1,
        created_at=c_at,
        updated_at=u_at
    )
