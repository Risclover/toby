from app.extensions import db

class Household(db.Model):
    __tablename__ = "households"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    creator_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    invite_code = db.Column(db.String, unique=True, nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    # Relationships
    members = db.relationship(
        "User",
        back_populates="household",
        foreign_keys="[User.household_id]"  # explicitly specify which FK
    )
    creator = db.relationship(
        "User",
        foreign_keys=[creator_id]
    )

    todo_lists = db.relationship("TodoList", back_populates="household")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "createdAt": self.created_at,
            "members": [member.to_dict() for member in self.members],
            "inviteCode": self.invite_code,
            "creatorId": self.creator_id
        }

    def __repr__(self):
        return f"<Household {self.id}: {self.name}>"
