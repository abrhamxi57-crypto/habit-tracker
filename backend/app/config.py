import os
from typing import List

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "HabitFlow API")
    VERSION: str = os.getenv("VERSION", "1.0.0")
    API_V1_STR: str = os.getenv("API_V1_STR", "/api")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Database URL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./habitflow.db")
    
    # Security & JWT
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY", 
        "habitflow-development-secret-key-replace-in-production-needs-to-be-32bytes"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30")) # 30 days
    
    # Rate Limiting
    RATE_LIMIT_SENSITIVE_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_SENSITIVE_PER_MINUTE", "20"))
    
    # CORS Origins
    @property
    def CORS_ORIGINS(self) -> List[str]:
        raw = os.getenv("CORS_ORIGINS", "")
        if raw:
            return [origin.strip() for origin in raw.split(",") if origin.strip()]
        return [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:8080",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:8080"
        ]

settings = Settings()
