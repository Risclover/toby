# app/models/shopping_item.py
from app.extensions import db

class ShoppingItem(db.Model):
    __tablename__ = "shopping_items"

    id = db.Column(db.Integer, primary_key=True)

    # FKs
    shopping_list_id = db.Column(db.Integer, db.ForeignKey("shopping_lists.id"), nullable=False, index=True)
    shopping_category_id = db.Column(db.Integer, db.ForeignKey("shopping_categories.id"), nullable=True, index=True)

    # Fields
    name = db.Column(db.String(200), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    purchased = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    # Relationships
    shopping_list = db.relationship("ShoppingList", back_populates="items")
    category = db.relationship("ShoppingCategory", back_populates="items")

    def to_dict(self):
        return {
            "id": self.id,
            "shoppingListId": self.shopping_list_id,
            "categoryId": self.shopping_category_id,
            "category": self.category.name if self.category else None,
            "name": self.name,
            "quantity": self.quantity,
            "purchased": self.purchased,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }

    def __repr__(self):
        return f"<ShoppingItem {self.id} {self.name!r}>"
