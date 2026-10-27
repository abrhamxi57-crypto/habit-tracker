import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Integer, Date, DateTime, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.guid import GUID

class HabitSchedule(Base):
    __tablename__ = "habit_schedules"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    habit_id = Column(GUID, ForeignKey("habits.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Schedule type: 'daily', 'weekdays', 'weekends', 'custom', 'weekly_target'
    schedule_type = Column(String(50), default="daily", nullable=False)
    
    # Selected weekdays: 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday
    # Uses standard ISO weekday indexing (0=Monday, 6=Sunday)
    custom_weekdays = Column(JSON, default=list, nullable=False)
    
    # For weekly-target schedules: number of required completions per calendar week (e.g., 3)
    target_days_per_week = Column(Integer, default=5, nullable=True)
    
    start_date = Column(Date, default=date.today, nullable=False)
    end_date = Column(Date, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    habit = relationship("Habit", back_populates="schedules")
    owner = relationship("User", back_populates="schedules")

    __table_args__ = (
        Index("idx_schedules_habit_dates", "habit_id", "start_date", "end_date"),
    )
