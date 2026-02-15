from sqlalchemy import func, Index, UniqueConstraint
from app.extensions import db
from app.utils.timezone import utc_datetime_to_local

class Announcement(db.Model):
    __tablename__ = "announcements"

    id = db.Column(db.Integer, primary_key=True)
    household_id = db.Column(db.Integer, db.ForeignKey("households.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_important = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())

    seen_by = db.relationship("AnnouncementSeen", back_populates="announcement", cascade="all, delete-orphan")
    creator = db.relationship("User", foreign_keys=[user_id])
    household = db.relationship("Household", back_populates="announcements")
    
    def to_dict(self, user=None):
        # Remove the conversion logic.
        # We want to send the raw UTC time to the frontend.
        created_at_local = utc_datetime_to_local(user, self.created_at) if user else self.created_at
        return {
            "id": self.id,
            "householdId": self.household_id,
            "userId": self.user_id,
            "message": self.message,
            "isImportant": self.is_important,
            # Ensure it has the Z suffix to indicate UTC
            "createdAt": created_at_local.isoformat() if created_at_local else None,
            "creator": {
                "id": self.creator.id,
                "firstName": self.creator.first_name,
                "profileImg": self.creator.profile_img,
            } if self.creator else None,
        }
    
    def __repr__(self):
        return f"<Announcement id={self.id} household_id={self.household_id} user_id={self.user_id}>"

class AnnouncementSeen(db.Model):
    __tablename__ = "announcement_seen"
    
    id = db.Column(db.Integer, primary_key=True)
    announcement_id = db.Column(db.Integer, db.ForeignKey("announcements.id", ondelete="CASCADE"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    seen_at = db.Column(db.DateTime(timezone=True), server_default=func.now())

    announcement = db.relationship("Announcement", back_populates="seen_by")
    user = db.relationship("User")

    __table_args__ = (UniqueConstraint("announcement_id", "user_id", name="uq_announcement_user_seen"),)