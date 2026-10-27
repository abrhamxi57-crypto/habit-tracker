import time
from collections import defaultdict
from typing import Dict, List
from fastapi import Request, HTTPException, status
from app.config import settings

class InMemoryRateLimiter:
    """Sliding-window rate limiter per client IP."""
    def __init__(self, requests_per_minute: int = 30):
        self.requests_per_minute = requests_per_minute
        self.window_seconds = 60
        self.hits: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        cutoff = now - self.window_seconds
        
        # Filter out timestamps older than 60 seconds
        recent = [t for t in self.hits[client_ip] if t > cutoff]
        self.hits[client_ip] = recent
        
        if len(recent) >= self.requests_per_minute:
            return False
            
        self.hits[client_ip].append(now)
        return True

sensitive_rate_limiter = InMemoryRateLimiter(
    requests_per_minute=settings.RATE_LIMIT_SENSITIVE_PER_MINUTE
)

async def check_rate_limit(request: Request):
    """FastAPI dependency to rate limit sensitive endpoints."""
    # Retrieve client IP, taking into account X-Forwarded-For if behind proxy
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else "unknown"

    if not sensitive_rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts. Please wait a minute before trying again."
        )
