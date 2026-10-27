import uuid
from datetime import datetime, timedelta
from typing import Optional, Tuple, Set
import bcrypt
import jwt
from app.config import settings

# In-memory revocation set for revoked JWT token IDs / tokens
_revoked_tokens: Set[str] = set()

def hash_password(password: str) -> str:
    """Hash password with bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), 
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False

def validate_password_strength(password: str) -> Tuple[bool, str]:
    """
    Validate that password meets security requirements:
    - Minimum 8 characters
    - At least one digit or symbol
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not any(c.isdigit() or not c.isalnum() for c in password):
        return False, "Password must contain at least one number or special character."
    return True, ""

def create_access_token(subject: str, extra_claims: Optional[dict] = None) -> str:
    """Create a signed JWT access token."""
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.utcnow(),
        "jti": str(uuid.uuid4()),
        "type": "access"
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(subject: str) -> str:
    """Create a signed JWT refresh token with longer expiration."""
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.utcnow(),
        "jti": str(uuid.uuid4()),
        "type": "refresh"
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> dict:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        jti = payload.get("jti")
        if jti and jti in _revoked_tokens:
            raise jwt.InvalidTokenError("Token has been revoked.")
        return payload
    except jwt.ExpiredSignatureError:
        raise
    except jwt.PyJWTError as e:
        raise jwt.InvalidTokenError(str(e))

def revoke_token(token_or_jti: str) -> None:
    """Mark a token or its JTI as revoked."""
    try:
        payload = jwt.decode(
            token_or_jti, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM],
            options={"verify_exp": False}
        )
        if "jti" in payload:
            _revoked_tokens.add(payload["jti"])
    except Exception:
        _revoked_tokens.add(token_or_jti)

def is_token_revoked(jti: str) -> bool:
    return jti in _revoked_tokens
