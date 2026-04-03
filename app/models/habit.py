from app.extensions import db
from datetime import date, timedelta


class Habit(db.Model):
    __tablename__ = "habits"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(200), nullable=True)
    color = db.Column(db.String(50), default="rgb(5, 5, 73)", nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_private = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    user = db.relationship("User", back_populates="habits")
    completions = db.relationship(
        "HabitCompletion",
        back_populates="habit",
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        today = date.today()
        # Sunday-based week to match dayjs().startOf("week")
        start_of_week = today - timedelta(days=(today.weekday() + 1) % 7)
        week_dates = {start_of_week + timedelta(days=i) for i in range(7)}

        completed_dates = {c.local_date for c in self.completions}

        is_completed_today = today in completed_dates
        completions_this_week = [
            d.isoformat() for d in sorted(week_dates & completed_dates)
        ]

        return {
            "id": self.id,
            "userId": self.user_id,
            "name": self.name,
            "description": self.description,
            "color": self.color,
            "isActive": self.is_active,
            "isPrivate": self.is_private,
            "createdAt": self.created_at,
            "isCompletedToday": is_completed_today,
            "completionsThisWeek": completions_this_week,  # e.g. ["2025-01-06", "2025-01-08"]
        }

    def __repr__(self):
        return f"<Habit {self.id}: {self.name}>"