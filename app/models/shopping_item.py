from app.extensions import db

class ShoppingItem(db.Model):
    __tablename__ = "shopping_items"

    id = db.Column(db.Integer, primary_key=True)
    shopping_list_id = db.Column(db.Integer, db.ForeignKey("shopping_lists.id"))
    name = db.Column(db.String, nullable=False)
    category=db.Column(db.String, nullable=True)
    quantity=db.Column(db.Integer, default=1)
    purchased=db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    shopping_list = db.relationship("ShoppingList", back_populates="items")

    def to_dict(self):
        return {
            "id": self.id,
            "shoppingListId": self.shopping_list_id,
            "name": self.name,
            "category": self.category,
            "quantity": self.quantity,
            "purchased": self.purchased,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at
        }
    
    def __repr__(self):
        return f"Shopping Item {self.id}"