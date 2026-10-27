from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import get_current_user_or_default
from app.models.user import User
from app.models.habit import Habit
from app.models.completion import HabitCompletion
from app.schemas.analytics import HabitInsightResponse
from app.services.insights_engine import generate_insights

router = APIRouter(prefix="/insights", tags=["insights"])

@router.get("", response_model=List[HabitInsightResponse])
def get_habit_insights(
    user: User = Depends(get_current_user_or_default),
    db: Session = Depends(get_db)
):
    habits = db.query(Habit).filter(
        Habit.owner_id == user.id,
        Habit.is_archived == False
    ).all()

    completions = db.query(HabitCompletion).filter(
        HabitCompletion.owner_id == user.id
    ).all()

    return generate_insights(habits, completions)
