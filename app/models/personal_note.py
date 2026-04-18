from app.extensions import db
import uuid

class PersonalNote(db.Model): 
    __tablename__ = "personal_notes"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())[:8])
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(50), nullable=True)
    body = db.Column(db.Text, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("personal_note_categories.id"), nullable=True)
    is_private = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    # Relationships
    author = db.relationship("User", back_populates="notes")
    category = db.relationship("PersonalNoteCategory", back_populates="category_notes")

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "title": self.title,
            "body": self.body,
            "categoryId": self.category_id,
            "isPrivate": self.is_private,
            "category": {
                "id": self.category.id,
                "name": self.category.name,
                "color": self.category.color
            } if self.category else None,
            "createdAt": self.created_at.isoformat() + "Z",
            "updatedAt": self.updated_at.isoformat() + "Z",
        }