"""
HabitFlow Development Seed Data Routine.
Populates a realistic demo user with 60 days of varied habit activity.
"""
import uuid
import random
from datetime import datetime, date, timedelta
from app.database import SessionLocal, init_db
from app.models.user import User
from app.models.preference import UserPreference
from app.models.habit import Habit
from app.models.schedule import HabitSchedule
from app.models.completion import HabitCompletion
from app.models.reminder import Reminder
from app.core.security import hash_password

def seed_database():
    init_db()
    db = SessionLocal()

    try:
        # Check if seed user exists
        demo_email = "demo@habitflow.app"
        user = db.query(User).filter(User.email == demo_email).first()

        if user:
            print(f"Seed user {demo_email} already exists. Skipping recreation.")
            return

        print("Seeding database with realistic development data...")
        now = datetime.utcnow()
        user_id = uuid.uuid4()

        # 1. Create demo user
        user = User(
            id=user_id,
            email=demo_email,
            hashed_password=hash_password("DemoHabits2026!"),
            display_name="Alex Mercer",
            timezone="America/New_York",
            preferred_theme="dark",
            is_active=True,
            created_at=now - timedelta(days=90),
            updated_at=now
        )
        db.add(user)

        # 2. Preferences
        pref = UserPreference(
            id=uuid.uuid4(),
            user_id=user.id,
            sound_enabled=True,
            email_reminders=False,
            week_start_day=1,
            daily_reminder_time="08:00",
            created_at=now - timedelta(days=90),
            updated_at=now
        )
        db.add(pref)

        # 3. Create realistic habits
        habit_configs = [
            {
                "name": "Morning Mindfulness",
                "description": "15 minutes of silent meditation & breathwork",
                "category": "mind",
                "color": "#8b5cf6",
                "icon": "Sparkles",
                "tracking_type": "boolean",
                "target_value": 1.0,
                "unit": "session",
                "schedule_type": "daily",
                "custom_weekdays": [0, 1, 2, 3, 4, 5, 6],
                "completion_prob": 0.88,
                "reminder_time": "07:30"
            },
            {
                "name": "Hydration Goal",
                "description": "Drink at least 8 glasses of pure water",
                "category": "health",
                "color": "#06b6d4",
                "icon": "Droplets",
                "tracking_type": "numeric",
                "target_value": 8.0,
                "unit": "glasses",
                "schedule_type": "daily",
                "custom_weekdays": [0, 1, 2, 3, 4, 5, 6],
                "completion_prob": 0.92,
                "reminder_time": "09:00"
            },
            {
                "name": "Deep Work Flow",
                "description": "2 hours of uninterrupted deep engineering work",
                "category": "productivity",
                "color": "#6366f1",
                "icon": "Flame",
                "tracking_type": "numeric",
                "target_value": 120.0,
                "unit": "mins",
                "schedule_type": "weekdays",
                "custom_weekdays": [0, 1, 2, 3, 4],
                "completion_prob": 0.82,
                "reminder_time": "10:00"
            },
            {
                "name": "Strength Training",
                "description": "Weight training or bodyweight calisthenics",
                "category": "fitness",
                "color": "#10b981",
                "icon": "Activity",
                "tracking_type": "boolean",
                "target_value": 1.0,
                "unit": "workout",
                "schedule_type": "custom",
                "custom_weekdays": [0, 2, 4, 5], # Mon, Wed, Fri, Sat
                "completion_prob": 0.80,
                "reminder_time": "17:30"
            },
            {
                "name": "Read Non-Fiction",
                "description": "Read 25 pages of cognitive science or history",
                "category": "learning",
                "color": "#f59e0b",
                "icon": "BookOpen",
                "tracking_type": "numeric",
                "target_value": 25.0,
                "unit": "pages",
                "schedule_type": "daily",
                "custom_weekdays": [0, 1, 2, 3, 4, 5, 6],
                "completion_prob": 0.75,
                "reminder_time": "21:30"
            }
        ]

        today = date.today()

        for config in habit_configs:
            h_id = uuid.uuid4()
            start_d = today - timedelta(days=60)

            habit = Habit(
                id=h_id,
                owner_id=user.id,
                name=config["name"],
                description=config["description"],
                category=config["category"],
                color=config["color"],
                icon=config["icon"],
                tracking_type=config["tracking_type"],
                target_value=config["target_value"],
                unit=config["unit"],
                start_date=start_d,
                is_archived=False,
                is_active=True,
                version=1,
                created_at=now - timedelta(days=60),
                updated_at=now
            )
            db.add(habit)

            # Schedule
            sched = HabitSchedule(
                id=uuid.uuid4(),
                habit_id=habit.id,
                owner_id=user.id,
                schedule_type=config["schedule_type"],
                custom_weekdays=config["custom_weekdays"],
                start_date=start_d,
                created_at=now - timedelta(days=60),
                updated_at=now
            )
            db.add(sched)

            # Reminder
            if config.get("reminder_time"):
                rem = Reminder(
                    id=uuid.uuid4(),
                    habit_id=habit.id,
                    owner_id=user.id,
                    reminder_time=config["reminder_time"],
                    days_of_week=config["custom_weekdays"],
                    is_enabled=True,
                    channel="in_app",
                    created_at=now - timedelta(days=60),
                    updated_at=now
                )
                db.add(rem)

            # 4. Generate 60 days of historical completions
            prob = config["completion_prob"]
            for day_offset in range(60, -1, -1):
                cur_date = today - timedelta(days=day_offset)
                py_dow = cur_date.weekday()

                # Check if scheduled
                is_sched = True
                if config["schedule_type"] == "weekdays":
                    is_sched = py_dow in (0, 1, 2, 3, 4)
                elif config["schedule_type"] == "custom":
                    is_sched = py_dow in config["custom_weekdays"]

                if not is_sched:
                    continue

                # Simulate realistic completion with slight recent momentum
                hit = random.random() < (prob + (0.05 if day_offset <= 14 else 0.0))

                if hit:
                    if config["tracking_type"] == "numeric":
                        val = config["target_value"] if random.random() > 0.1 else (config["target_value"] * 0.7)
                    else:
                        val = 1.0

                    status_str = "completed" if val >= config["target_value"] else "partial"
                    comp = HabitCompletion(
                        id=uuid.uuid4(),
                        habit_id=habit.id,
                        owner_id=user.id,
                        local_date=cur_date,
                        completion_value=val,
                        status=status_str,
                        notes="Great session!" if random.random() < 0.2 else "",
                        client_operation_id=f"seed_{habit.id}_{cur_date}",
                        created_at=datetime.combine(cur_date, datetime.min.time()) + timedelta(hours=19),
                        updated_at=datetime.combine(cur_date, datetime.min.time()) + timedelta(hours=19)
                    )
                    db.add(comp)

        db.commit()
        print(f"Successfully seeded demo data for {demo_email} (Password: DemoHabits2026!)")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
