import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Float, Text, Date, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.guid import GUID

class HabitCompletion(Base):
    __tablename__ = "habit_completions"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    habit_id = Column(GUID, ForeignKey("habits.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Habit-local completion date (strictly recorded in the user's local timezone)
    local_date = Column(Date, nullable=False, index=True)
    
    # Quantitative completion amount (e.g., 1.0 for boolean, 8.0 for 8 glasses)
    completion_value = Column(Float, default=1.0, nullable=False)
    
    # Status: 'completed', 'partial', 'skipped'
    status = Column(String(20), default="completed", nullable=False)
    
    notes = Column(Text, default="", nullable=True)
    
    # Stable client-generated operation ID for idempotency and offline sync deduplication
    client_operation_id = Column(String(64), unique=True, nullable=True, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, index=True)

    # Relationships
    habit = relationship("Habit", back_populates="completions")
    owner = relationship("User", back_populates="completions")

    __table_args__ = (
        # Strict database constraint: at most one canonical completion record per habit per local date
        UniqueConstraint("habit_id", "local_date", name="uq_habit_local_date"),
        Index("idx_completions_owner_date", "owner_id", "local_date"),
        Index("idx_completions_habit_status", "habit_id", "status"),
    )
