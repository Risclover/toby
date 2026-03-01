from app.models import User
from app.extensions import db
from werkzeug.security import generate_password_hash
from sqlalchemy import text

def seed_users():
    sara = User(
        first_name="Sara",
        last_name="Dunlop",
        email="sara@aa.io",
        hashed_password=generate_password_hash("password"),
        household_id=1
    )
    john = User(
        first_name="John",
        last_name="Ervin",
        email="john@aa.io",
        hashed_password=generate_password_hash("password"),
        household_id=1
    )
    db.session.add_all([sara, john])
    db.session.commit()

def undo_users():
    db.session.execute(text("DELETE FROM users"))
    db.session.commit()