import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.guid import GUID

class User(Base):
    __tablename__ = "users"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    display_name = Column(String(100), nullable=False)
    timezone = Column(String(50), default="UTC", nullable=False)
    preferred_theme = Column(String(20), default="dark", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    habits = relationship("Habit", back_populates="owner", cascade="all, delete-orphan")
    schedules = relationship("HabitSchedule", back_populates="owner", cascade="all, delete-orphan")
    completions = relationship("HabitCompletion", back_populates="owner", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="owner", cascade="all, delete-orphan")
    preferences = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    sync_operations = relationship("SyncOperation", back_populates="user", cascade="all, delete-orphan")
