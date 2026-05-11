from sqlalchemy import select

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.user import User

DEMO_USERS = [
    ("client@example.com", "client"),
    ("reviewer@example.com", "reviewer"),
    ("admin@example.com", "admin"),
]


def seed_users() -> None:
    with SessionLocal() as db:
        for email, role in DEMO_USERS:
            existing = db.scalar(select(User).where(User.email == email))
            if existing is not None:
                continue
            db.add(
                User(
                    email=email,
                    role=role,
                    password_hash=get_password_hash("password123"),
                )
            )
        db.commit()


if __name__ == "__main__":
    seed_users()
    print("Seed users ready.")

