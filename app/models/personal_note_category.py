from app.extensions import db

class PersonalNoteCategory(db.Model):
    __tablename__ = "personal_note_categories"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(20), nullable=False)
    color = db.Column(db.String(50), nullable=False, default="rgb(5, 5, 73)")

    category_notes = db.relationship("PersonalNote", back_populates="category")
    user = db.relationship("User", back_populates="note_categories")

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "name": self.name,
            "color": self.color,
            "notes": [{"id": note.id, "title": note.title} for note in self.category_notes]
        }
