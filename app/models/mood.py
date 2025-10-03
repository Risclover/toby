from app.extensions import db
from sqlalchemy import Enum
from sqlalchemy.schema import UniqueConstraint
from datetime import datetime, timezone

MoodEnum = Enum(
    "happy", "content", "neutral", "tired", "stressed", "sick", "busy", "bored",
    "accomplished", "proud", "excited", "productive", "overwhelmed", "motivated",
    "cozy", "inspired",
    name="mood_enum",
)

class Mood(db.Model):
    __tablename__ = "moods"
    __table_args__ = (UniqueConstraint("user_id", name="uq_user_moods_user_id"),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True, unique=True)
    mood = db.Column(MoodEnum, nullable=False)

    user = db.relationship("User", back_populates="user_mood", uselist=False)

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "mood": str(self.mood),
        }
