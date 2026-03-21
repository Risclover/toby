from app.extensions import db
from datetime import date


class HabitCompletion(db.Model):
    __tablename__ = "habit_completions"

    id = db.Column(db.Integer, primary_key=True)
    habit_id = db.Column(db.Integer, db.ForeignKey("habits.id"), nullable=False)
    local_date = db.Column(db.Date, nullable=False)

    habit = db.relationship("Habit", back_populates="completions")

    __table_args__ = (
        db.UniqueConstraint("habit_id", "local_date", name="uq_habit_completion_per_day"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "habitId": self.habit_id,
            "localDate": self.local_date.isoformat(),
        }

    def __repr__(self):
        return f"<HabitCompletion habit={self.habit_id} date={self.local_date}>"