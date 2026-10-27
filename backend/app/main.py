from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.api.auth import router as auth_router
from app.api.habits import router as habits_router
from app.api.logs import router as logs_router
from app.api.analytics import router as analytics_router
from app.api.insights import router as insights_router
from app.api.sync import router as sync_router
from app.api.reminders import router as reminders_router

# Initialize database tables
init_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="HabitFlow Backend - High Performance Habit Tracking & Offline Sync Engine"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/api/health", tags=["health"])
def health_check():
    return {
        "status": "healthy",
        "service": "HabitFlow API",
        "version": settings.VERSION
    }

# Include API routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(habits_router, prefix=settings.API_V1_STR)
app.include_router(logs_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(insights_router, prefix=settings.API_V1_STR)
app.include_router(sync_router, prefix=settings.API_V1_STR)
app.include_router(reminders_router, prefix=settings.API_V1_STR)
