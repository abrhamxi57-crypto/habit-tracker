from datetime import date, timedelta, datetime
from typing import List, Dict, Any, Optional
from app.models.habit import Habit
from app.models.completion import HabitCompletion
from app.services.streak_calculator import calculate_habit_streak, is_habit_scheduled_on_date, _is_completion_done

def generate_insights(
    habits: List[Habit], 
    completions: List[HabitCompletion], 
    ref_date: Optional[date] = None
) -> List[Dict[str, Any]]:
    """
    Deterministic explainable habit insights engine without external AI dependencies.
    Generates actionable feedback:
    - Consistency praise
    - Best performing weekday
    - Streak at-risk alert
    - Schedule optimization suggestions
    """
    if ref_date is None:
        ref_date = date.today()

    active_habits = [h for h in habits if not getattr(h, "is_archived", False)]
    if not active_habits:
        return []

    insights = []
    stats_list = [calculate_habit_streak(h, completions, ref_date) for h in active_habits]

    # 1. Top streak leader (Praise)
    sorted_by_streak = sorted(stats_list, key=lambda s: s["current_streak"], reverse=True)
    if sorted_by_streak and sorted_by_streak[0]["current_streak"] >= 3:
        leader = sorted_by_streak[0]
        insights.append({
            "id": f"insight_streak_{leader['habit_id']}",
            "type": "praise",
            "habit_id": leader["habit_id"],
            "habit_title": leader["habit_title"],
            "title": f"{leader['habit_title']} is on fire!",
            "description": f"You've maintained a {leader['current_streak']}-day streak with {leader['consistency_rate_30d']}% consistency over the past 30 days.",
            "metric": f"{leader['current_streak']} days",
            "importance": "high"
        })

    # 2. Weekday pattern analysis over past 30 days
    weekday_done = [0] * 7
    weekday_sched = [0] * 7
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    comp_set = set()
    for c in completions:
        h_obj = next((h for h in active_habits if str(h.id) == str(c.habit_id)), None)
        target_val = float(h_obj.target_value or 1.0) if h_obj else 1.0
        if _is_completion_done(c, target_val):
            d_val = c.local_date
            d_str = d_val.strftime("%Y-%m-%d") if isinstance(d_val, (date, datetime)) else str(d_val)[:10]
            comp_set.add((str(c.habit_id), d_str))

    for i in range(30):
        d = ref_date - timedelta(days=i)
        d_str = d.strftime("%Y-%m-%d")
        w_idx = d.weekday()

        for h in active_habits:
            if is_habit_scheduled_on_date(h, d):
                weekday_sched[w_idx] += 1
                if (str(h.id), d_str) in comp_set:
                    weekday_done[w_idx] += 1

    best_w = -1
    best_rate = -1
    for w in range(7):
        if weekday_sched[w] >= 3:
            rate = int(round((weekday_done[w] / weekday_sched[w]) * 100))
            if rate > best_rate:
                best_rate = rate
                best_w = w

    if best_w != -1 and best_rate >= 60:
        insights.append({
            "id": "insight_best_weekday",
            "type": "pattern",
            "title": f"{day_names[best_w]} is your powerhouse day",
            "description": f"You achieve an average of {best_rate}% habit completion on {day_names[best_w]}s.",
            "metric": f"{best_rate}% rate",
            "importance": "medium"
        })

    # 3. Habits at risk (Warning)
    at_risk = next(
        (s for s in stats_list if s["is_scheduled_today"] and not s["completed_today"] and s["current_streak"] >= 3),
        None
    )
    if at_risk:
        insights.append({
            "id": f"insight_risk_{at_risk['habit_id']}",
            "type": "warning",
            "habit_id": at_risk["habit_id"],
            "habit_title": at_risk["habit_title"],
            "title": f"Protect your {at_risk['current_streak']}-day streak on {at_risk['habit_title']}",
            "description": "Scheduled for today and waiting for checkoff. Complete it to keep the flame burning!",
            "metric": f"{at_risk['current_streak']}d at risk",
            "importance": "high"
        })

    # 4. Schedule adjustment recommendation
    for s in stats_list:
        if s["consistency_rate_30d"] < 40 and s["total_completions"] >= 5:
            insights.append({
                "id": f"insight_adjust_{s['habit_id']}",
                "type": "recommendation",
                "habit_id": s["habit_id"],
                "habit_title": s["habit_title"],
                "title": f"Consider tuning {s['habit_title']}'s schedule",
                "description": f"Adherence has been {s['consistency_rate_30d']}% recently. Reducing target frequency or switching to selected weekdays can help re-establish consistency.",
                "metric": f"{s['consistency_rate_30d']}% rate",
                "importance": "medium"
            })
            break

    return insights
