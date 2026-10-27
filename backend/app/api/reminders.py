import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import get_current_user_or_default
from app.models.user import User
from app.models.habit import Habit
from app.models.reminder import Reminder
from app.schemas.reminder import ReminderCreate, ReminderUpdate, ReminderResponse

router = APIRouter(prefix="/reminders", tags=["reminders"])

def _to_response(reminder: Reminder, habit_title: Optional[str] = None) -> ReminderResponse:
    c_at = reminder.created_at.isoformat() if isinstance(reminder.created_at, datetime) else str(reminder.created_at)
    u_at = reminder.updated_at.isoformat() if isinstance(reminder.updated_at, datetime) else str(reminder.updated_at)
    title = habit_title or (reminder.habit.name if reminder.habit else None)

    return ReminderResponse(
        id=str(reminder.id),
        habit_id=str(reminder.habit_id) if reminder.habit_id else None,
        habit_title=title,
        reminder_time=reminder.reminder_time,
        days_of_week=reminder.days_of_week or [0, 1, 2, 3, 4, 5, 6],
        is_enabled=bool(reminder.is_enabled),
        channel=reminder.channel or "in_app",
        created_at=c_at,
        updated_at=u_at
    )

@router.get("", response_model=List[ReminderResponse])
def get_reminders(
    user: User = Depends(get_current_user_or_default),
    db: Session = Depends(get_db)
):
    reminders = db.query(Reminder).filter(Reminder.owner_id == user.id).all()
    return [_to_response(r) for r in reminders]

@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
def create_reminder(
    payload: ReminderCreate,
    user: User = Depends(get_current_user_or_default),
    db: Session = Depends(get_db)
):
    habit_uuid = None
    habit_name = None
    if payload.habit_id:
        try:
            habit_uuid = uuid.UUID(payload.habit_id)
            habit = db.query(Habit).filter(Habit.id == habit_uuid, Habit.owner_id == user.id).first()
            if not habit:
                raise HTTPException(status_code=404, detail="Associated habit not found.")
            habit_name = habit.name
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid habit ID format.")

    now = datetime.utcnow()
    reminder = Reminder(
        id=uuid.uuid4(),
        habit_id=habit_uuid,
        owner_id=user.id,
        reminder_time=payload.reminder_time,
        days_of_week=payload.days_of_week,
        is_enabled=payload.is_enabled,
        channel=payload.channel,
        created_at=now,
        updated_at=now
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return _to_response(reminder, habit_title=habit_name)

@router.put("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(
    reminder_id: str,
    payload: ReminderUpdate,
    user: User = Depends(get_current_user_or_default),
    db: Session = Depends(get_db)
):
    try:
        r_uuid = uuid.UUID(reminder_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid reminder ID format.")

    reminder = db.query(Reminder).filter(Reminder.id == r_uuid, Reminder.owner_id == user.id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found.")

    if payload.habit_id is not None:
        try:
            h_uuid = uuid.UUID(payload.habit_id) if payload.habit_id else None
            reminder.habit_id = h_uuid
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid habit ID format.")

    if payload.reminder_time is not None:
        reminder.reminder_time = payload.reminder_time
    if payload.days_of_week is not None:
        reminder.days_of_week = payload.days_of_week
    if payload.is_enabled is not None:
        reminder.is_enabled = payload.is_enabled
    if payload.channel is not None:
        reminder.channel = payload.channel

    reminder.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(reminder)
    return _to_response(reminder)

@router.patch("/{reminder_id}/toggle", response_model=ReminderResponse)
def toggle_reminder(
    reminder_id: str,
    user: User = Depends(get_current_user_or_default),
    db: Session = Depends(get_db)
):
    try:
        r_uuid = uuid.UUID(reminder_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid reminder ID format.")

    reminder = db.query(Reminder).filter(Reminder.id == r_uuid, Reminder.owner_id == user.id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found.")

    reminder.is_enabled = not reminder.is_enabled
    reminder.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(reminder)
    return _to_response(reminder)

@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: str,
    user: User = Depends(get_current_user_or_default),
    db: Session = Depends(get_db)
):
    try:
        r_uuid = uuid.UUID(reminder_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid reminder ID format.")

    reminder = db.query(Reminder).filter(Reminder.id == r_uuid, Reminder.owner_id == user.id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found.")

    db.delete(reminder)
    db.commit()
    return None
