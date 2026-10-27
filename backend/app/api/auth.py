import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.preference import UserPreference
from app.core.security import (
    hash_password,
    verify_password,
    validate_password_strength,
    create_access_token,
    create_refresh_token,
    decode_token,
    revoke_token
)
from app.core.rate_limit import check_rate_limit
from app.core.dependencies import get_current_user
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    RefreshTokenRequest,
    ChangePasswordRequest,
    UserProfileUpdate,
    UserPreferenceUpdate,
    UserPreferencesResponse,
    UserResponse,
    TokenResponse
)

router = APIRouter(prefix="/auth", tags=["auth"])

def _user_to_response(user: User) -> UserResponse:
    pref_res = None
    if user.preferences:
        p = user.preferences
        pref_res = UserPreferencesResponse(
            sound_enabled=bool(p.sound_enabled),
            email_reminders=bool(p.email_reminders),
            week_start_day=int(p.week_start_day or 1),
            daily_reminder_time=p.daily_reminder_time or "09:00"
        )
    else:
        pref_res = UserPreferencesResponse()

    c_at = user.created_at.isoformat() if isinstance(user.created_at, datetime) else str(user.created_at)

    return UserResponse(
        id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        timezone=user.timezone or "UTC",
        preferred_theme=user.preferred_theme or "dark",
        is_active=bool(user.is_active),
        created_at=c_at,
        preferences=pref_res
    )

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    await check_rate_limit(request)

    # Validate password requirements
    is_valid, msg = validate_password_strength(payload.password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    # Check for existing email
    normalized_email = payload.email.lower().strip()
    existing = db.query(User).filter(User.email == normalized_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    now = datetime.utcnow()
    user_id = uuid.uuid4()
    new_user = User(
        id=user_id,
        email=normalized_email,
        hashed_password=hash_password(payload.password),
        display_name=payload.display_name.strip(),
        timezone=payload.timezone,
        preferred_theme=payload.preferred_theme,
        is_active=True,
        created_at=now,
        updated_at=now
    )
    db.add(new_user)

    # Initialize default user preferences
    pref = UserPreference(
        id=uuid.uuid4(),
        user_id=new_user.id,
        sound_enabled=True,
        email_reminders=False,
        week_start_day=1,
        daily_reminder_time="09:00",
        created_at=now,
        updated_at=now
    )
    db.add(pref)

    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(str(new_user.id), {"email": new_user.email})
    refresh_token = create_refresh_token(str(new_user.id))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=_user_to_response(new_user)
    )

@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    await check_rate_limit(request)

    normalized_email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == normalized_email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated."
        )

    access_token = create_access_token(str(user.id), {"email": user.email})
    refresh_token = create_refresh_token(str(user.id))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=_user_to_response(user)
    )

@router.post("/refresh", response_model=TokenResponse)
def refresh_token_endpoint(
    payload: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    try:
        decoded = decode_token(payload.refresh_token)
        if decoded.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type for refresh."
            )
        user_id = decoded.get("sub")
        user = db.query(User).filter(User.id == uuid.UUID(str(user_id))).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")

        # Revoke old refresh token to prevent replay attacks
        revoke_token(payload.refresh_token)

        new_access = create_access_token(str(user.id), {"email": user.email})
        new_refresh = create_refresh_token(str(user.id))

        return TokenResponse(
            access_token=new_access,
            refresh_token=new_refresh,
            token_type="bearer",
            user=_user_to_response(user)
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Expired or invalid refresh token.")

@router.post("/logout")
def logout(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
        revoke_token(token)
    return {"message": "Logged out successfully."}

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    return _user_to_response(current_user)

@router.put("/profile", response_model=UserResponse)
def update_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if payload.display_name is not None:
        current_user.display_name = payload.display_name.strip()
    if payload.timezone is not None:
        current_user.timezone = payload.timezone
    if payload.preferred_theme is not None:
        current_user.preferred_theme = payload.preferred_theme

    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return _user_to_response(current_user)

@router.put("/preferences", response_model=UserPreferencesResponse)
def update_preferences(
    payload: UserPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pref = current_user.preferences
    now = datetime.utcnow()

    if not pref:
        pref = UserPreference(
            id=uuid.uuid4(),
            user_id=current_user.id,
            sound_enabled=True,
            email_reminders=False,
            week_start_day=1,
            daily_reminder_time="09:00",
            created_at=now,
            updated_at=now
        )
        db.add(pref)

    if payload.sound_enabled is not None:
        pref.sound_enabled = payload.sound_enabled
    if payload.email_reminders is not None:
        pref.email_reminders = payload.email_reminders
    if payload.week_start_day is not None:
        pref.week_start_day = payload.week_start_day
    if payload.daily_reminder_time is not None:
        pref.daily_reminder_time = payload.daily_reminder_time

    pref.updated_at = now
    db.commit()
    db.refresh(pref)

    return UserPreferencesResponse(
        sound_enabled=bool(pref.sound_enabled),
        email_reminders=bool(pref.email_reminders),
        week_start_day=int(pref.week_start_day or 1),
        daily_reminder_time=pref.daily_reminder_time
    )

@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    await check_rate_limit(request)

    if not verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password incorrect.")

    is_valid, msg = validate_password_strength(payload.new_password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    current_user.hashed_password = hash_password(payload.new_password)
    current_user.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Password changed successfully."}
