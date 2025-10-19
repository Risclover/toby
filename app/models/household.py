from app.extensions import db

class Household(db.Model):
    __tablename__ = "households"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    creator_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    invite_code = db.Column(db.String, unique=True, nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    
    tzid = db.Column(db.String(64), nullable=False, default="America/Los_Angeles")
    announcements_ttl_mode = db.Column(db.Enum("rolling", "midnight", name="ann_ttl_mode"), nullable=False, server_default="rolling")
    announcements_ttl_hours = db.Column(db.Integer, nullable=False, server_default="24")

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
    shopping_lists = db.relationship("ShoppingList", back_populates="household")
    todo_lists = db.relationship("TodoList", back_populates="household")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "createdAt": self.created_at,
            "members": [member.to_dict() for member in self.members],
            "inviteCode": self.invite_code,
            "creatorId": self.creator_id,
            "tzid": self.tzid 
        }

    def __repr__(self):
        return f"<Household {self.id}: {self.name}>"
