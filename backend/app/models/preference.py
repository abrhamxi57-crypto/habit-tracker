import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.guid import GUID

class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    sound_enabled = Column(Boolean, default=True, nullable=False)
    email_reminders = Column(Boolean, default=False, nullable=False)
    week_start_day = Column(Integer, default=1, nullable=False) # 1 = Monday, 0 = Sunday
    daily_reminder_time = Column(String(10), default="09:00", nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="preferences")
