from app.extensions import db


class ShoppingList(db.Model):
    __tablename__ = "shopping_lists"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(50), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    household_id = db.Column(db.Integer, db.ForeignKey("households.id"), nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    items = db.relationship("ShoppingItem", back_populates="shopping_list")
    user = db.relationship("User")
    household = db.relationship("Household")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "userId": self.user_id,
            "householdId": self.household_id,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at
        }
    
    def __repr__(self):
        return f"Shopping List {self.id}"