import uuid
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import get_current_user_or_default
from app.models.user import User
from app.models.habit import Habit
from app.models.schedule import HabitSchedule
from app.models.reminder import Reminder
from app.schemas.habit import HabitCreate, HabitUpdate, HabitResponse, habit_to_response

router = APIRouter(prefix="/habits", tags=["habits"])

def _parse_date(val: Optional[str]) -> Optional[date]:
    if not val:
        return None
    try:
        return date.fromisoformat(val[:10])
    except Exception:
        return None

@router.get("", response_model=List[HabitResponse])
def get_habits(
    include_archived: bool = False,
    user: User = Depends(get_current_user_or_default),
    db: Session = Depends(get_db)
):
    query = db.query(Habit).filter(Habit.owner_id == user.id)
    if not include_archived:
        query = query.filter(Habit.is_archived == False)
    habits = query.order_by(Habit.created_at.desc()).all()
    return [habit_to_response(h) for h in habits]

@router.post("", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
def create_habit(
    habit_in: HabitCreate,
    user: User = Depends(get_current_user_or_default),
    db: Session = Depends(get_db)
):
    habit_id = uuid.UUID(habit_in.id) if habit_in.id else uuid.uuid4()
    now = datetime.utcnow()
    start_d = _parse_date(habit_in.start_date) or date.today()
    end_d = _parse_date(habit_in.end_date)

    habit = Habit(
        id=habit_id,
        owner_id=user.id,
        name=habit_in.name,
        description=habit_in.description or "",
        category=habit_in.category or "productivity",
        color=habit_in.color or "#8b5cf6",
        icon=habit_in.icon or "Sparkles",
        tracking_type=habit_in.tracking_type or "boolean",
        target_value=float(habit_in.target_value or 1.0),
        unit=habit_in.unit or "",
        start_date=start_d,
        end_date=end_d,
        is_archived=bool(habit_in.is_archived),
        is_active=bool(habit_in.is_active),
        version=1,
        created_at=now,
        updated_at=now
    )
    db.add(habit)

    # Attach primary schedule
    schedule = HabitSchedule(
        id=uuid.uuid4(),
        habit_id=habit.id,
        owner_id=user.id,
        schedule_type=habit_in.schedule_type or "daily",
        custom_weekdays=habit_in.custom_weekdays or [0, 1, 2, 3, 4, 5, 6],
        target_days_per_week=habit_in.target_days_per_week or 5,
        start_date=start_d,
        end_date=end_d,
        created_at=now,
        updated_at=now
    )
    db.add(schedule)

    # Optional reminder
    if habit_in.reminder_time:
        reminder = Reminder(
            id=uuid.uuid4(),
            habit_id=habit.id,
            owner_id=user.id,
            reminder_time=habit_in.reminder_time,
            days_of_week=habit_in.custom_weekdays or [0, 1, 2, 3, 4, 5, 6],
            is_enabled=True,
            channel="in_app",
            created_at=now,
            updated_at=now
        )
        db.add(reminder)

    db.commit()
    db.refresh(habit)
    return habit_to_response(habit)

@router.get("/{habit_id}", response_model=HabitResponse)
def get_habit(
    habit_id: str,
    user: User = Depends(get_current_user_or_default),
    db: Session = Depends(get_db)
):
    try:
        h_uuid = uuid.UUID(habit_id)
        habit = db.query(Habit).filter(Habit.id == h_uuid, Habit.owner_id == user.id).first()
    except ValueError:
        habit = db.query(Habit).filter(Habit.name == habit_id, Habit.owner_id == user.id).first()

    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    return habit_to_response(habit)

@router.put("/{habit_id}", response_model=HabitResponse)
def update_habit(
    habit_id: str,
    habit_in: HabitUpdate,
    user: User = Depends(get_current_user_or_default),
    db: Session = Depends(get_db)
):
    try:
        h_uuid = uuid.UUID(habit_id)
        habit = db.query(Habit).filter(Habit.id == h_uuid, Habit.owner_id == user.id).first()
    except ValueError:
        habit = db.query(Habit).filter(Habit.name == habit_id, Habit.owner_id == user.id).first()

    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    now = datetime.utcnow()
    update_data = habit_in.model_dump(exclude_unset=True)

    # Map aliases
    if "title" in update_data and "name" not in update_data:
        habit.name = update_data["title"]
    elif "name" in update_data:
        habit.name = update_data["name"]

    if "description" in update_data:
        habit.description = update_data["description"]
    if "category" in update_data:
        habit.category = update_data["category"]
    if "color" in update_data:
        habit.color = update_data["color"]
    if "icon" in update_data:
        habit.icon = update_data["icon"]

    if "target_type" in update_data and "tracking_type" not in update_data:
        habit.tracking_type = update_data["target_type"]
    elif "tracking_type" in update_data:
        habit.tracking_type = update_data["tracking_type"]

    if "target_value" in update_data and update_data["target_value"] is not None:
        habit.target_value = float(update_data["target_value"])
    if "unit" in update_data:
        habit.unit = update_data["unit"]
    if "start_date" in update_data:
        habit.start_date = _parse_date(update_data["start_date"]) or habit.start_date
    if "end_date" in update_data:
        habit.end_date = _parse_date(update_data["end_date"])
    if "archived" in update_data and "is_archived" not in update_data:
        habit.is_archived = bool(update_data["archived"])
    elif "is_archived" in update_data:
        habit.is_archived = bool(update_data["is_archived"])
    if "is_active" in update_data:
        habit.is_active = bool(update_data["is_active"])

    habit.version = (habit.version or 1) + 1
    habit.updated_at = now

    # Update or create schedule
    sched_type = update_data.get("schedule_type") or update_data.get("frequency_type")
    c_weekdays = update_data.get("custom_weekdays") or update_data.get("custom_days")
    t_days = update_data.get("target_days_per_week") or update_data.get("weekly_target_days")

    if habit.schedules:
        schedule = habit.schedules[0]
        if sched_type:
            schedule.schedule_type = sched_type
        if c_weekdays is not None:
            schedule.custom_weekdays = c_weekdays
        if t_days is not None:
            schedule.target_days_per_week = t_days
        schedule.updated_at = now
    elif sched_type or c_weekdays is not None:
        schedule = HabitSchedule(
            id=uuid.uuid4(),
            habit_id=habit.id,
            owner_id=user.id,
            schedule_type=sched_type or "daily",
            custom_weekdays=c_weekdays or [0, 1, 2, 3, 4, 5, 6],
            target_days_per_week=t_days or 5,
            start_date=habit.start_date,
            end_date=habit.end_date,
            created_at=now,
            updated_at=now
        )
        db.add(schedule)

    # Update or create reminder
    rem_time = update_data.get("reminder_time")
    if rem_time is not None:
        if habit.reminders:
            reminder = habit.reminders[0]
            reminder.reminder_time = rem_time
            reminder.is_enabled = bool(rem_time)
            reminder.updated_at = now
        elif rem_time:
            reminder = Reminder(
                id=uuid.uuid4(),
                habit_id=habit.id,
                owner_id=user.id,
                reminder_time=rem_time,
                days_of_week=c_weekdays or [0, 1, 2, 3, 4, 5, 6],
                is_enabled=True,
                channel="in_app",
                created_at=now,
                updated_at=now
            )
            db.add(reminder)

    db.commit()
    db.refresh(habit)
    return habit_to_response(habit)

@router.post("/{habit_id}/archive", response_model=HabitResponse)
def archive_habit(
    habit_id: str,
    user: User = Depends(get_current_user_or_default),
    db: Session = Depends(get_db)
):
    try:
        h_uuid = uuid.UUID(habit_id)
        habit = db.query(Habit).filter(Habit.id == h_uuid, Habit.owner_id == user.id).first()
    except ValueError:
        habit = db.query(Habit).filter(Habit.name == habit_id, Habit.owner_id == user.id).first()

    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    habit.is_archived = True
    habit.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(habit)
    return habit_to_response(habit)

@router.post("/{habit_id}/restore", response_model=HabitResponse)
def restore_habit(
    habit_id: str,
    user: User = Depends(get_current_user_or_default),
    db: Session = Depends(get_db)
):
    try:
        h_uuid = uuid.UUID(habit_id)
        habit = db.query(Habit).filter(Habit.id == h_uuid, Habit.owner_id == user.id).first()
    except ValueError:
        habit = db.query(Habit).filter(Habit.name == habit_id, Habit.owner_id == user.id).first()

    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    habit.is_archived = False
    habit.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(habit)
    return habit_to_response(habit)

@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habit(
    habit_id: str,
    user: User = Depends(get_current_user_or_default),
    db: Session = Depends(get_db)
):
    try:
        h_uuid = uuid.UUID(habit_id)
        habit = db.query(Habit).filter(Habit.id == h_uuid, Habit.owner_id == user.id).first()
    except ValueError:
        habit = db.query(Habit).filter(Habit.name == habit_id, Habit.owner_id == user.id).first()

    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    db.delete(habit)
    db.commit()
    return None
