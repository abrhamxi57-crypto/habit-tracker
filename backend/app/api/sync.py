import uuid
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import get_current_user_or_default
from app.models.user import User
from app.models.habit import Habit
from app.models.schedule import HabitSchedule
from app.models.completion import HabitCompletion
from app.models.sync import SyncOperation
from app.schemas.sync import BatchSyncRequest, BatchSyncResponse
from app.schemas.habit import HabitResponse, habit_to_response
from app.schemas.log import LogResponse, completion_to_response

router = APIRouter(prefix="/sync", tags=["sync"])

def _parse_iso_datetime(dt_str: Optional[str]) -> Optional[datetime]:
    if not dt_str:
        return None
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        return None

def _parse_date(d_str: Optional[str]) -> date:
    if not d_str:
        return date.today()
    try:
        return date.fromisoformat(d_str[:10])
    except Exception:
        return date.today()

@router.post("", response_model=BatchSyncResponse)
def batch_sync(
    payload: BatchSyncRequest,
    user: User = Depends(get_current_user_or_default),
    db: Session = Depends(get_db)
):
    server_now = datetime.utcnow()
    server_now_str = server_now.isoformat()
    applied_count = 0
    conflicts_resolved = 0

    # 1. Process client habit mutations
    if payload.habits:
        for h_data in payload.habits:
            raw_id = h_data.get("id")
            if not raw_id:
                continue

            try:
                h_uuid = uuid.UUID(raw_id)
            except ValueError:
                h_uuid = uuid.uuid4()

            existing = db.query(Habit).filter(Habit.id == h_uuid, Habit.owner_id == user.id).first()
            client_updated_str = h_data.get("updated_at")
            client_updated_dt = _parse_iso_datetime(client_updated_str) or server_now

            title_val = h_data.get("title") or h_data.get("name") or "Untitled"
            desc_val = h_data.get("description", "")
            cat_val = h_data.get("category", "productivity")
            color_val = h_data.get("color", "#8b5cf6")
            icon_val = h_data.get("icon", "Sparkles")
            track_type = h_data.get("tracking_type") or h_data.get("target_type") or "boolean"
            target_val = float(h_data.get("target_value", 1.0))
            unit_val = h_data.get("unit", "")
            is_arch = bool(h_data.get("is_archived") if h_data.get("is_archived") is not None else h_data.get("archived", False))

            sched_type = h_data.get("schedule_type") or h_data.get("frequency_type") or "daily"
            c_weekdays = h_data.get("custom_weekdays") or h_data.get("custom_days") or [0, 1, 2, 3, 4, 5, 6]
            t_days = h_data.get("target_days_per_week") or h_data.get("weekly_target_days") or 5

            if existing:
                # Last-Write-Wins
                if client_updated_dt >= (existing.updated_at or datetime.min):
                    existing.name = title_val
                    existing.description = desc_val
                    existing.category = cat_val
                    existing.color = color_val
                    existing.icon = icon_val
                    existing.tracking_type = track_type
                    existing.target_value = target_val
                    existing.unit = unit_val
                    existing.is_archived = is_arch
                    existing.updated_at = client_updated_dt
                    existing.version = (existing.version or 1) + 1

                    if existing.schedules:
                        s = existing.schedules[0]
                        s.schedule_type = sched_type
                        s.custom_weekdays = c_weekdays
                        s.target_days_per_week = t_days
                        s.updated_at = client_updated_dt
                    applied_count += 1
                else:
                    conflicts_resolved += 1
            else:
                new_habit = Habit(
                    id=h_uuid,
                    owner_id=user.id,
                    name=title_val,
                    description=desc_val,
                    category=cat_val,
                    color=color_val,
                    icon=icon_val,
                    tracking_type=track_type,
                    target_value=target_val,
                    unit=unit_val,
                    start_date=date.today(),
                    is_archived=is_arch,
                    is_active=True,
                    version=1,
                    created_at=client_updated_dt,
                    updated_at=client_updated_dt
                )
                db.add(new_habit)

                schedule = HabitSchedule(
                    id=uuid.uuid4(),
                    habit_id=new_habit.id,
                    owner_id=user.id,
                    schedule_type=sched_type,
                    custom_weekdays=c_weekdays,
                    target_days_per_week=t_days,
                    start_date=date.today(),
                    created_at=client_updated_dt,
                    updated_at=client_updated_dt
                )
                db.add(schedule)
                applied_count += 1

    # 2. Process client log / completion mutations
    if payload.logs:
        for l_data in payload.logs:
            habit_raw_id = l_data.get("habit_id")
            date_raw = l_data.get("date") or l_data.get("local_date")

            if not habit_raw_id or not date_raw:
                continue

            try:
                habit_uuid = uuid.UUID(habit_raw_id)
            except ValueError:
                # Find habit by ID or skip
                continue

            local_d = _parse_date(date_raw)
            client_updated_str = l_data.get("updated_at")
            client_updated_dt = _parse_iso_datetime(client_updated_str) or server_now

            is_completed = bool(l_data.get("completed", False))
            val = float(l_data.get("current_value") if l_data.get("current_value") is not None else l_data.get("completion_value", 1.0 if is_completed else 0.0))
            status_val = l_data.get("status") or ("completed" if is_completed else "partial")
            notes_val = l_data.get("notes", "")
            op_id = l_data.get("client_operation_id") or l_data.get("id")

            existing_comp = db.query(HabitCompletion).filter(
                HabitCompletion.habit_id == habit_uuid,
                HabitCompletion.local_date == local_d
            ).first()

            if existing_comp:
                if client_updated_dt >= (existing_comp.updated_at or datetime.min):
                    existing_comp.completion_value = val
                    existing_comp.status = status_val
                    existing_comp.notes = notes_val
                    if op_id:
                        existing_comp.client_operation_id = op_id
                    existing_comp.updated_at = client_updated_dt
                    applied_count += 1
                else:
                    conflicts_resolved += 1
            else:
                new_comp = HabitCompletion(
                    id=uuid.uuid4(),
                    habit_id=habit_uuid,
                    owner_id=user.id,
                    local_date=local_d,
                    completion_value=val,
                    status=status_val,
                    notes=notes_val,
                    client_operation_id=op_id,
                    created_at=client_updated_dt,
                    updated_at=client_updated_dt
                )
                db.add(new_comp)
                applied_count += 1

    # 3. Log SyncOperation records for audit & idempotency
    if payload.mutations:
        for m in payload.mutations:
            existing_op = db.query(SyncOperation).filter(
                SyncOperation.client_operation_id == m.id
            ).first()
            if not existing_op:
                db_op = SyncOperation(
                    id=uuid.uuid4(),
                    client_operation_id=m.id,
                    user_id=user.id,
                    entity_type=m.entity_type,
                    entity_id=m.entity_id,
                    action=m.action,
                    status="applied",
                    payload=m.payload,
                    applied_at=server_now
                )
                db.add(db_op)

    db.commit()

    # 4. Fetch server updates since last_sync_timestamp
    server_habits_q = db.query(Habit).filter(Habit.owner_id == user.id)
    server_comps_q = db.query(HabitCompletion).filter(HabitCompletion.owner_id == user.id)

    if payload.last_sync_timestamp:
        last_sync_dt = _parse_iso_datetime(payload.last_sync_timestamp)
        if last_sync_dt:
            server_habits_q = server_habits_q.filter(Habit.updated_at > last_sync_dt)
            server_comps_q = server_comps_q.filter(HabitCompletion.updated_at > last_sync_dt)

    server_habits = server_habits_q.all()
    server_comps = server_comps_q.all()

    return BatchSyncResponse(
        success=True,
        server_timestamp=server_now_str,
        applied_count=applied_count,
        server_habits=[habit_to_response(h) for h in server_habits],
        server_logs=[completion_to_response(c) for c in server_comps],
        conflicts_resolved=conflicts_resolved
    )
