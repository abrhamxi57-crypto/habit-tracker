"""
HabitLog compatibility module.
Points to HabitCompletion model for seamless transition.
"""
from app.models.completion import HabitCompletion

# Backward compatibility alias
HabitLog = HabitCompletion

__all__ = ["HabitLog", "HabitCompletion"]
