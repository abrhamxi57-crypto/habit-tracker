from datetime import date, timedelta
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import get_current_user_or_default
from app.models.user import User
from app.models.habit import Habit
from app.models.completion import HabitCompletion
from app.schemas.analytics import AnalyticsOverview, StreakReport, WeeklyMetric, CategoryMetric
from app.services.streak_calculator import calculate_habit_streak, is_habit_scheduled_on_date, _is_completion_done

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("", response_model=AnalyticsOverview)
def get_analytics(
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

    today = date.today()

    streaks: List[StreakReport] = [
        StreakReport(**calculate_habit_streak(h, completions, today)) for h in habits
    ]

    best_streak = max((s.longest_streak for s in streaks), default=0)
    total_completions = sum(s.total_completions for s in streaks)
    avg_consistency = int(round(
        sum(s.consistency_rate_30d for s in streaks) / len(streaks)
    )) if streaks else 0

    # Weekly metrics for current calendar week (Monday to Sunday)
    start_of_week = today - timedelta(days=today.weekday())
    weekly_metrics: List[WeeklyMetric] = []
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    # Pre-map completed habits by (habit_id, date_str)
    comp_map = set()
    for c in completions:
        h_obj = next((h for h in habits if h.id == c.habit_id), None)
        target_val = float(h_obj.target_value or 1.0) if h_obj else 1.0
        if _is_completion_done(c, target_val):
            d_val = c.local_date
            d_str = d_val.strftime("%Y-%m-%d") if isinstance(d_val, date) else str(d_val)[:10]
            comp_map.add((str(c.habit_id), d_str))

    for i in range(7):
        d = start_of_week + timedelta(days=i)
        d_str = d.strftime("%Y-%m-%d")

        scheduled = 0
        completed = 0
        for h in habits:
            if is_habit_scheduled_on_date(h, d):
                scheduled += 1
                if (str(h.id), d_str) in comp_map:
                    completed += 1

        rate = int(round((completed / scheduled) * 100)) if scheduled > 0 else 0
        weekly_metrics.append(
            WeeklyMetric(
                day_name=day_names[i],
                date=d_str,
                completed=completed,
                scheduled=scheduled,
                rate=rate
            )
        )

    # Category distribution
    category_colors = {
        "health": "#10b981",
        "fitness": "#06b6d4",
        "mind": "#8b5cf6",
        "productivity": "#6366f1",
        "learning": "#f59e0b",
        "personal": "#ec4899"
    }
    categories = list(set(h.category for h in habits))
    category_distribution: List[CategoryMetric] = []

    for cat in categories:
        cat_habits = [h for h in habits if h.category == cat]
        cat_ids = set(str(h.id) for h in cat_habits)
        cat_completions = [c for c in completions if str(c.habit_id) in cat_ids and c.status == "completed"]

        # 30-day rate
        sched = 0
        done = 0
        for i in range(30):
            d = today - timedelta(days=i)
            d_str = d.strftime("%Y-%m-%d")
            for h in cat_habits:
                if is_habit_scheduled_on_date(h, d):
                    sched += 1
                    if (str(h.id), d_str) in comp_map:
                        done += 1
        rate = int(round((done / sched) * 100)) if sched > 0 else 0

        category_distribution.append(
            CategoryMetric(
                category=cat.capitalize(),
                count=len(cat_habits),
                completions=len(cat_completions),
                rate=rate,
                color=category_colors.get(cat.lower(), "#6366f1")
            )
        )

    return AnalyticsOverview(
        best_streak=best_streak,
        average_consistency=avg_consistency,
        total_completions=total_completions,
        active_habits_count=len(habits),
        streaks=streaks,
        weekly_metrics=weekly_metrics,
        category_distribution=category_distribution
    )
