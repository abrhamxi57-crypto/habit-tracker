import uuid
from typing import Optional
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.core.security import decode_token, hash_password

DEFAULT_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEFAULT_USER_EMAIL = "default@habitflow.app"

def get_or_create_default_user(db: Session) -> User:
    """Ensures a baseline default user exists for development, tests, and non-auth sessions."""
    user = db.query(User).filter((User.id == DEFAULT_USER_ID) | (User.email == DEFAULT_USER_EMAIL)).first()
    if not user:
        user = User(
            id=DEFAULT_USER_ID,
            email=DEFAULT_USER_EMAIL,
            hashed_password=hash_password("HabitFlow2026!"),
            display_name="HabitFlow User",
            timezone="UTC",
            preferred_theme="dark",
            is_active=True
        )
        db.add(user)
        try:
            db.commit()
            db.refresh(user)
        except Exception:
            db.rollback()
            user = db.query(User).filter((User.id == DEFAULT_USER_ID) | (User.email == DEFAULT_USER_EMAIL)).first()
    return user

def get_current_user_or_default(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Returns the authenticated user if valid Bearer token provided,
    otherwise gracefully falls back to the default user session.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        try:
            payload = decode_token(token)
            user_id = payload.get("sub")
            if user_id:
                try:
                    user_uuid = uuid.UUID(str(user_id))
                    user = db.query(User).filter(User.id == user_uuid).first()
                except ValueError:
                    user = db.query(User).filter(User.email == str(user_id)).first()
                if user and user.is_active:
                    return user
        except Exception:
            pass

    return get_or_create_default_user(db)

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """Strictly requires an authenticated user with a valid JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
        try:
            user_uuid = uuid.UUID(str(user_id))
            user = db.query(User).filter(User.id == user_uuid).first()
        except ValueError:
            user = db.query(User).filter(User.email == str(user_id)).first()

        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
