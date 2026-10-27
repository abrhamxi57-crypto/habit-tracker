import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.guid import GUID

class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    habit_id = Column(GUID, ForeignKey("habits.id", ondelete="CASCADE"), nullable=True, index=True)
    owner_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # 24-hour time string in user local timezone, e.g. "08:30"
    reminder_time = Column(String(10), nullable=False)
    
    # Selected weekdays: list of ints [0..6] (0=Mon, 6=Sun)
    days_of_week = Column(JSON, default=lambda: [0, 1, 2, 3, 4, 5, 6], nullable=False)
    
    is_enabled = Column(Boolean, default=True, nullable=False, index=True)
    channel = Column(String(20), default="in_app", nullable=False) # 'in_app' or 'browser'
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    habit = relationship("Habit", back_populates="reminders")
    owner = relationship("User", back_populates="reminders")

    __table_args__ = (
        Index("idx_reminders_owner_enabled", "owner_id", "is_enabled"),
    )
