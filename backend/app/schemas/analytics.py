from typing import List, Optional
from pydantic import BaseModel

class StreakReport(BaseModel):
    habit_id: str
    habit_title: str
    current_streak: int
    longest_streak: int
    total_completions: int
    completed_today: bool
    is_scheduled_today: bool
    consistency_rate_7d: int
    consistency_rate_30d: int
    consistency_rate_90d: int
    streak_status: str

class WeeklyMetric(BaseModel):
    day_name: str
    date: str
    completed: int
    scheduled: int
    rate: int

class CategoryMetric(BaseModel):
    category: str
    count: int
    completions: int
    rate: int
    color: str

class HabitInsightResponse(BaseModel):
    id: str
    type: str # 'praise', 'warning', 'recommendation', 'pattern'
    habit_id: Optional[str] = None
    habit_title: Optional[str] = None
    title: str
    description: str
    metric: Optional[str] = None
    importance: str = "medium"

class AnalyticsOverview(BaseModel):
    best_streak: int
    average_consistency: int
    total_completions: int
    active_habits_count: int
    streaks: List[StreakReport]
    weekly_metrics: List[WeeklyMetric]
    category_distribution: List[CategoryMetric]
