from app.extensions import db


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
        return {
            "id": self.id,
            "userId": self.user_id,
            "name": self.name,
            "description": self.description,
            "color": self.color,
            "isActive": self.is_active,
            "isPrivate": self.is_private,
            "createdAt": self.created_at,
        }

    def __repr__(self):
        return f"<Habit {self.id}: {self.name}>"