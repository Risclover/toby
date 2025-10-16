from app.extensions import db

class Announcement(db.Model):
    __tablename__ = "announcements"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    household_id = db.Column(db.Integer, db.ForeignKey("households.id"), nullable=False)
    
    text = db.Column(db.String(120), nullable=False)
    is_pinned = db.Column(db.Boolean, default=False, nullable=False)
    
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), onupdate=db.func.now(), nullable=False)
    
    published_at = db.Column(db.DateTime(timezone=True), nullable=True) 
    expires_at = db.Column(db.DateTime(timezone=True), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "householdId": self.household_id,
            "text": self.text,
            "isPinned": self.is_pinned, 
            "createdAt": self.created_at, 
            "updatedAt": self.updated_at,
            "publishedAt": self.published_at,
            "expiresAt": self.expires_at
        }
    
    def __repr__(self):
        return f"Announcement {id} from user {user_id}"