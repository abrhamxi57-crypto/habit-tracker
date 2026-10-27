import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Boolean, Float, Text, DateTime, Date, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.guid import GUID

class Habit(Base):
    __tablename__ = "habits"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    owner_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="", nullable=True)
    category = Column(String(50), default="productivity", nullable=False, index=True)
    color = Column(String(30), default="#8b5cf6", nullable=False)
    icon = Column(String(50), default="Sparkles", nullable=False)
    tracking_type = Column(String(20), default="boolean", nullable=False) # 'boolean' or 'numeric'
    target_value = Column(Float, default=1.0, nullable=False)
    unit = Column(String(50), default="", nullable=True)
    start_date = Column(Date, default=date.today, nullable=False)
    end_date = Column(Date, nullable=True)
    is_archived = Column(Boolean, default=False, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    version = Column(Integer, default=1, nullable=False) # Revision counter for sync & optimistic concurrency
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, index=True)

    # Relationships
    owner = relationship("User", back_populates="habits")
    schedules = relationship("HabitSchedule", back_populates="habit", cascade="all, delete-orphan", order_by="HabitSchedule.created_at.desc()")
    completions = relationship("HabitCompletion", back_populates="habit", cascade="all, delete-orphan", order_by="HabitCompletion.local_date.desc()")
    reminders = relationship("Reminder", back_populates="habit", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_habits_owner_active", "owner_id", "is_archived", "is_active"),
    )
