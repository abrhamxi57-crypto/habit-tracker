from datetime import datetime, date, timedelta
from typing import List, Dict, Optional, Any
from app.models.habit import Habit
from app.models.completion import HabitCompletion

def is_habit_scheduled_on_date(habit: Habit, check_date: date) -> bool:
    """
    Determines whether a habit is scheduled on a given calendar date,
    supporting daily, weekdays, weekends, custom days, and weekly targets.
    """
    if getattr(habit, "is_archived", False):
        return False

    # Start date boundary
    start_d = habit.start_date
    if isinstance(start_d, datetime):
        start_d = start_d.date()
    if start_d and check_date < start_d:
        return False

    # End date boundary
    end_d = habit.end_date
    if isinstance(end_d, datetime):
        end_d = end_d.date()
    if end_d and check_date > end_d:
        return False

    schedule = habit.schedules[0] if getattr(habit, "schedules", None) else None
    sched_type = schedule.schedule_type if schedule else "daily"

    # Python weekday(): Mon=0..Sun=6; JS weekday(): Sun=0..Sat=6
    py_weekday = check_date.weekday()
    js_weekday = (py_weekday + 1) % 7

    if sched_type == "daily":
        return True
    elif sched_type == "weekdays":
        return py_weekday in (0, 1, 2, 3, 4)
    elif sched_type == "weekends":
        return py_weekday in (5, 6)
    elif sched_type == "custom":
        custom_days = schedule.custom_weekdays if schedule else []
        if not custom_days:
            return True
        return (py_weekday in custom_days) or (js_weekday in custom_days)
    elif sched_type == "weekly_target":
        return True

    return True

def _is_completion_done(c: HabitCompletion, target_val: float) -> bool:
    if c.status == "completed":
        return True
    if c.completion_value is not None and c.completion_value >= target_val:
        return True
    return False

def calculate_habit_streak(
    habit: Habit, 
    completions: List[HabitCompletion], 
    ref_date: Optional[date] = None
) -> Dict[str, Any]:
    """
    Domain streak engine:
    - Calculates current & longest streaks
    - Unscheduled rest days do NOT break streaks
    - Calculates completion rates over 7, 30, and 90 days
    - Accurately classifies streak tier
    """
    if ref_date is None:
        ref_date = date.today()

    habit_id = str(habit.id)
    target_val = float(habit.target_value or 1.0)

    # Index completions by local_date string YYYY-MM-DD
    comp_map: Dict[str, HabitCompletion] = {}
    for c in completions:
        if str(c.habit_id) == habit_id:
            d_val = c.local_date
            if isinstance(d_val, datetime):
                d_str = d_val.date().strftime("%Y-%m-%d")
            elif isinstance(d_val, date):
                d_str = d_val.strftime("%Y-%m-%d")
            else:
                d_str = str(d_val)[:10]
            comp_map[d_str] = c

    ref_date_str = ref_date.strftime("%Y-%m-%d")
    is_scheduled_today = is_habit_scheduled_on_date(habit, ref_date)
    today_comp = comp_map.get(ref_date_str)
    completed_today = bool(today_comp and _is_completion_done(today_comp, target_val))

    total_completions = sum(1 for c in comp_map.values() if _is_completion_done(c, target_val))

    # --- Current Streak Calculation ---
    current_streak = 0
    cur_date = ref_date

    if is_scheduled_today and completed_today:
        current_streak += 1
        cur_date = cur_date - timedelta(days=1)
    else:
        # If not done today, streak is still alive from yesterday
        cur_date = cur_date - timedelta(days=1)

    lookback = 365
    streak_broken = False

    while lookback > 0 and not streak_broken:
        lookback -= 1
        d_str = cur_date.strftime("%Y-%m-%d")
        is_sched = is_habit_scheduled_on_date(habit, cur_date)

        if is_sched:
            comp = comp_map.get(d_str)
            if comp and _is_completion_done(comp, target_val):
                current_streak += 1
            else:
                streak_broken = True
        # If not scheduled on this day, skip without breaking the streak!

        cur_date = cur_date - timedelta(days=1)

    # --- Longest Streak Calculation over 180 days ---
    longest_streak = 0
    running_streak = 0
    for i in range(180, -1, -1):
        d = ref_date - timedelta(days=i)
        d_str = d.strftime("%Y-%m-%d")
        if is_habit_scheduled_on_date(habit, d):
            comp = comp_map.get(d_str)
            if comp and _is_completion_done(comp, target_val):
                running_streak += 1
                if running_streak > longest_streak:
                    longest_streak = running_streak
            else:
                running_streak = 0

    if current_streak > longest_streak:
        longest_streak = current_streak

    # --- Consistency Rates ---
    def get_rate(days_count: int) -> int:
        scheduled = 0
        done = 0
        for i in range(days_count):
            d = ref_date - timedelta(days=i)
            if is_habit_scheduled_on_date(habit, d):
                scheduled += 1
                comp = comp_map.get(d.strftime("%Y-%m-%d"))
                if comp and _is_completion_done(comp, target_val):
                    done += 1
        return int(round((done / scheduled) * 100)) if scheduled > 0 else 0

    rate_7d = get_rate(7)
    rate_30d = get_rate(30)
    rate_90d = get_rate(90)

    # --- Streak Status Tier ---
    streak_status = "idle"
    if current_streak >= 30:
        streak_status = "supernova"
    elif current_streak >= 14:
        streak_status = "inferno"
    elif current_streak >= 7:
        streak_status = "blaze"
    elif current_streak >= 3:
        streak_status = "flame"
    elif current_streak >= 1:
        streak_status = "spark"

    habit_name = habit.name or getattr(habit, "title", "Untitled")

    return {
        "habit_id": habit_id,
        "habit_title": habit_name,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "total_completions": total_completions,
        "completed_today": completed_today,
        "is_scheduled_today": is_scheduled_today,
        "consistency_rate_7d": rate_7d,
        "consistency_rate_30d": rate_30d,
        "consistency_rate_90d": rate_90d,
        "streak_status": streak_status
    }
