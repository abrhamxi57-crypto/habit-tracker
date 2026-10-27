import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base, get_db
import app.models  # Ensure all tables are loaded into Base.metadata
from app.main import app

# In-memory SQLite for testing with StaticPool
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_create_and_get_habit():
    habit_payload = {
        "title": "Morning Meditation",
        "description": "10 minutes of mindfulness",
        "category": "mind",
        "color": "#8b5cf6",
        "icon": "Sparkles",
        "frequency_type": "daily",
        "custom_days": [0, 1, 2, 3, 4, 5, 6],
        "target_type": "boolean",
        "target_value": 1.0,
        "time_of_day": "morning",
        "reminder_time": "08:00"
    }
    create_resp = client.post("/api/habits", json=habit_payload)
    assert create_resp.status_code == 201
    created_data = create_resp.json()
    assert created_data["title"] == "Morning Meditation"
    assert created_data["name"] == "Morning Meditation"
    assert created_data["id"] is not None
    assert created_data["reminder_time"] == "08:00"

    habit_id = created_data["id"]
    get_resp = client.get(f"/api/habits/{habit_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == habit_id

def test_update_and_archive_habit():
    # 1. Create habit
    create_resp = client.post("/api/habits", json={
        "title": "Read Philosophy",
        "category": "learning",
        "target_type": "numeric",
        "target_value": 20.0,
        "unit": "pages"
    })
    assert create_resp.status_code == 201
    habit_id = create_resp.json()["id"]

    # 2. Update habit
    update_resp = client.put(f"/api/habits/{habit_id}", json={
        "title": "Read Stoicism",
        "target_value": 30.0
    })
    assert update_resp.status_code == 200
    assert update_resp.json()["title"] == "Read Stoicism"
    assert update_resp.json()["target_value"] == 30.0

    # 3. Archive habit
    archive_resp = client.post(f"/api/habits/{habit_id}/archive")
    assert archive_resp.status_code == 200
    assert archive_resp.json()["archived"] is True

    # Active habits list should not include it
    list_resp = client.get("/api/habits")
    assert list_resp.status_code == 200
    assert not any(h["id"] == habit_id for h in list_resp.json())

    # Restore habit
    restore_resp = client.post(f"/api/habits/{habit_id}/restore")
    assert restore_resp.status_code == 200
    assert restore_resp.json()["archived"] is False

def test_toggle_habit_log():
    # 1. Create numeric habit
    create_resp = client.post("/api/habits", json={
        "title": "Drink Water",
        "category": "health",
        "target_type": "numeric",
        "target_value": 8.0,
        "unit": "glasses"
    })
    habit_id = create_resp.json()["id"]

    # 2. Toggle log for today
    toggle_resp = client.post(f"/api/logs/toggle/{habit_id}", json={
        "date": "2026-10-23",
        "current_value": 5.0
    })
    assert toggle_resp.status_code == 200
    data = toggle_resp.json()
    assert data["current_value"] == 5.0
    assert data["completed"] is False

    # Complete it
    complete_resp = client.post(f"/api/logs/toggle/{habit_id}", json={
        "date": "2026-10-23",
        "current_value": 8.0
    })
    assert complete_resp.status_code == 200
    assert complete_resp.json()["completed"] is True

    # 3. Create boolean habit
    bool_resp = client.post("/api/habits", json={
        "title": "Journaling",
        "category": "mind",
        "target_type": "boolean"
    })
    b_habit_id = bool_resp.json()["id"]

    # Toggle boolean on
    t1 = client.post(f"/api/logs/toggle/{b_habit_id}", json={"date": "2026-10-23"})
    assert t1.status_code == 200
    assert t1.json()["completed"] is True

    # Toggle boolean off
    t2 = client.post(f"/api/logs/toggle/{b_habit_id}", json={"date": "2026-10-23"})
    assert t2.status_code == 200
    assert t2.json()["completed"] is False

def test_analytics_and_insights():
    # 1. Create and complete a habit
    create_resp = client.post("/api/habits", json={
        "title": "Morning Run",
        "category": "fitness",
        "frequency_type": "daily"
    })
    h_id = create_resp.json()["id"]

    client.post(f"/api/logs/toggle/{h_id}", json={"date": "2026-10-23"})

    # Check analytics
    analytics_resp = client.get("/api/analytics")
    assert analytics_resp.status_code == 200
    data = analytics_resp.json()
    assert "best_streak" in data
    assert "weekly_metrics" in data
    assert len(data["weekly_metrics"]) == 7

    # Check insights
    insights_resp = client.get("/api/insights")
    assert insights_resp.status_code == 200
    assert isinstance(insights_resp.json(), list)

def test_batch_sync():
    sync_payload = {
        "habits": [
            {
                "id": "11111111-1111-1111-1111-111111111111",
                "title": "Offline Habit",
                "category": "productivity",
                "frequency_type": "daily",
                "target_type": "boolean",
                "updated_at": "2026-10-23T10:00:00"
            }
        ],
        "logs": [
            {
                "habit_id": "11111111-1111-1111-1111-111111111111",
                "date": "2026-10-23",
                "completed": True,
                "current_value": 1.0,
                "updated_at": "2026-10-23T10:05:00"
            }
        ],
        "mutations": [
            {
                "id": "mut_1",
                "entity_type": "habit",
                "entity_id": "11111111-1111-1111-1111-111111111111",
                "action": "create",
                "payload": "{}",
                "timestamp": "2026-10-23T10:00:00"
            }
        ]
    }
    sync_resp = client.post("/api/sync", json=sync_payload)
    assert sync_resp.status_code == 200
    sync_data = sync_resp.json()
    assert sync_data["success"] is True
    assert sync_data["applied_count"] >= 2
    assert len(sync_data["server_habits"]) >= 1

def test_auth_lifecycle():
    # 1. Register new user
    reg_payload = {
        "email": "tester@habitflow.app",
        "password": "Password123!",
        "display_name": "Test Engineer",
        "timezone": "America/Chicago",
        "preferred_theme": "dark"
    }
    reg_resp = client.post("/api/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    reg_data = reg_resp.json()
    assert "access_token" in reg_data
    assert "refresh_token" in reg_data
    assert reg_data["user"]["email"] == "tester@habitflow.app"
    access_token = reg_data["access_token"]
    refresh_token = reg_data["refresh_token"]

    # 2. Get profile with access token
    headers = {"Authorization": f"Bearer {access_token}"}
    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["display_name"] == "Test Engineer"

    # 3. Update profile
    prof_resp = client.put("/api/auth/profile", json={"display_name": "Senior Tester"}, headers=headers)
    assert prof_resp.status_code == 200
    assert prof_resp.json()["display_name"] == "Senior Tester"

    # 4. Refresh token
    ref_resp = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert ref_resp.status_code == 200
    new_access = ref_resp.json()["access_token"]

    # 5. Change password
    cp_resp = client.post(
        "/api/auth/change-password",
        json={"old_password": "Password123!", "new_password": "NewSecret456!"},
        headers={"Authorization": f"Bearer {new_access}"}
    )
    assert cp_resp.status_code == 200

    # 6. Login with new password
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "tester@habitflow.app", "password": "NewSecret456!"}
    )
    assert login_resp.status_code == 200

def test_reminders_crud():
    # 1. Create a habit first
    habit_resp = client.post("/api/habits", json={"title": "Evening Stretch"})
    h_id = habit_resp.json()["id"]

    # 2. Create reminder
    rem_payload = {
        "habit_id": h_id,
        "reminder_time": "20:30",
        "days_of_week": [0, 1, 2, 3, 4],
        "channel": "in_app"
    }
    rem_resp = client.post("/api/reminders", json=rem_payload)
    assert rem_resp.status_code == 201
    r_data = rem_resp.json()
    assert r_data["reminder_time"] == "20:30"
    r_id = r_data["id"]

    # 3. Get reminders
    list_resp = client.get("/api/reminders")
    assert list_resp.status_code == 200
    assert any(r["id"] == r_id for r in list_resp.json())

    # 4. Toggle reminder
    toggle_resp = client.patch(f"/api/reminders/{r_id}/toggle")
    assert toggle_resp.status_code == 200
    assert toggle_resp.json()["is_enabled"] is False

    # 5. Delete reminder
    del_resp = client.delete(f"/api/reminders/{r_id}")
    assert del_resp.status_code == 204
