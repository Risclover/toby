from app.extensions import db
from datetime import datetime, timezone
from app.utils.timezone import utc_datetime_to_local  # we'll use this

class Household(db.Model):
    __tablename__ = "households"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    admin_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    invite_code = db.Column(db.String(64), unique=True, nullable=True, index=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    tzid = db.Column(db.String(64), nullable=False, default="America/Los_Angeles")
    accent_color = db.Column(db.String(20), nullable=False, default="gray")
    
    announcements = db.relationship(
        "Announcement",
        back_populates="household",
        cascade="all, delete-orphan"
    )

    members = db.relationship(
        "User",
        back_populates="household",
        foreign_keys="[User.household_id]"
    )
    admin = db.relationship(
        "User",
        foreign_keys=[admin_id]
    )

    shopping_lists = db.relationship("ShoppingList", back_populates="household")
    tasklists = db.relationship("Tasklist", back_populates="household")
    reminders = db.relationship(
        "Reminder",
        back_populates="household",
        cascade="all, delete-orphan"
    )

    def to_dict(self, current_user=None):
        # Use user's tzid if provided, else fall back to household tzid
        def local(dt):
            if dt is None:
                return None
            return utc_datetime_to_local(current_user, dt).isoformat()

        return {
            "id": self.id,
            "name": self.name,
            "createdAt": local(self.created_at),
            "members": [member.to_dict() for member in self.members],
            "inviteCode": self.invite_code,
            "adminId": self.admin_id,
            "tzid": self.tzid
        }

    def __repr__(self):
        return f"<Household {self.id}: {self.name}>"