from sqlalchemy import func, Index, UniqueConstraint
from app.extensions import db
   
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
    
    def to_dict(self):
        return {
            "id": self.id,
            "householdId": self.household_id,
            "userId": self.user_id,
            "message": self.message,
            "isImportant": self.is_important,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "creator": {
                "id": self.creator.id,
                "name": self.creator.name,
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