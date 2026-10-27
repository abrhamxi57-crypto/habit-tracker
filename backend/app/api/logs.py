import uuid
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import get_current_user_or_default
from app.models.user import User
from app.models.habit import Habit
from app.models.completion import HabitCompletion
from app.schemas.log import LogCreate, LogResponse, ToggleRequest, completion_to_response

router = APIRouter(prefix="/logs", tags=["logs"])

def _parse_date(val: Optional[str]) -> date:
    if not val:
        return date.today()
    try:
        return date.fromisoformat(val[:10])
    except Exception:
        return date.today()

@router.get("", response_model=List[LogResponse])
def get_logs(
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    habit_id: Optional[str] = Query(None),
    user: User = Depends(get_current_user_or_default),
    db: Session = Depends(get_db)
):
    query = db.query(HabitCompletion).filter(HabitCompletion.owner_id == user.id)

    if date:
        parsed_d = _parse_date(date)
        query = query.filter(HabitCompletion.local_date == parsed_d)

    if habit_id:
        try:
            h_uuid = uuid.UUID(habit_id)
            query = query.filter(HabitCompletion.habit_id == h_uuid)
        except ValueError:
            pass

    completions = query.order_by(HabitCompletion.local_date.desc()).all()
    return [completion_to_response(c) for c in completions]

@router.post("/toggle/{habit_id}", response_model=LogResponse)
def toggle_log(
    habit_id: str,
    payload: ToggleRequest,
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

    target_date = _parse_date(payload.date)

    completion = db.query(HabitCompletion).filter(
        HabitCompletion.habit_id == habit.id,
        HabitCompletion.local_date == target_date
    ).first()

    now = datetime.utcnow()
    target_val = float(habit.target_value or 1.0)
    is_numeric = habit.tracking_type == "numeric"

    if is_numeric:
        if payload.current_value is not None:
            new_val = float(payload.current_value)
        else:
            prev_val = float(completion.completion_value) if completion else 0.0
            new_val = prev_val + 1.0
        is_completed = new_val >= target_val
        new_status = "completed" if is_completed else ("partial" if new_val > 0 else "skipped")
    else:
        # Boolean toggle
        prev_completed = completion.status == "completed" if completion else False
        is_completed = not prev_completed
        new_val = target_val if is_completed else 0.0
        new_status = "completed" if is_completed else "skipped"

    if not completion:
        completion = HabitCompletion(
            id=uuid.uuid4(),
            habit_id=habit.id,
            owner_id=user.id,
            local_date=target_date,
            completion_value=new_val,
            status=new_status,
            notes=payload.notes or "",
            client_operation_id=payload.client_operation_id,
            created_at=now,
            updated_at=now
        )
        db.add(completion)
    else:
        completion.completion_value = new_val
        completion.status = new_status
        if payload.notes is not None:
            completion.notes = payload.notes
        if payload.client_operation_id:
            completion.client_operation_id = payload.client_operation_id
        completion.updated_at = now

    db.commit()
    db.refresh(completion)
    return completion_to_response(completion)
