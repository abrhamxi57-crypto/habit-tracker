from typing import Optional, Dict, Any
import re
from pydantic import BaseModel, Field, ConfigDict, field_validator

class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=8)
    display_name: str = Field(..., min_length=1, max_length=100)
    timezone: str = "UTC"
    preferred_theme: str = "dark"

    @field_validator("email")
    def validate_email_format(cls, v: str) -> str:
        clean = v.strip().lower()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", clean):
            raise ValueError("Invalid email address format.")
        return clean

class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str

    @field_validator("email")
    def validate_email_format(cls, v: str) -> str:
        clean = v.strip().lower()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", clean):
            raise ValueError("Invalid email address format.")
        return clean

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)

class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    timezone: Optional[str] = None
    preferred_theme: Optional[str] = None

class UserPreferenceUpdate(BaseModel):
    sound_enabled: Optional[bool] = None
    email_reminders: Optional[bool] = None
    week_start_day: Optional[int] = None
    daily_reminder_time: Optional[str] = None

class UserPreferencesResponse(BaseModel):
    sound_enabled: bool = True
    email_reminders: bool = False
    week_start_day: int = 1
    daily_reminder_time: Optional[str] = "09:00"

    model_config = ConfigDict(from_attributes=True)

class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str
    timezone: str
    preferred_theme: str
    is_active: bool
    created_at: str
    preferences: Optional[UserPreferencesResponse] = None

    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
