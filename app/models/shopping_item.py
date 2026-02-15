# app/models/shopping_item.py
from app.extensions import db
from app.utils.timezone import utc_datetime_to_local
from flask_login import current_user

class ShoppingItem(db.Model):
    __tablename__ = "shopping_items"

    id = db.Column(db.Integer, primary_key=True)

    # FKs
    list_id = db.Column(db.Integer, db.ForeignKey("shopping_lists.id"), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey("shopping_categories.id", ondelete="SET NULL"), nullable=True, index=True)

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
            "listId": self.list_id,
            "categoryId": self.category_id,
            "category": self.category.name if self.category else None,
            "name": self.name,
            "quantity": self.quantity,
            "purchased": self.purchased,
            "createdAt": utc_datetime_to_local(current_user, self.created_at).isoformat() if self.created_at else None,
            "updatedAt": utc_datetime_to_local(current_user, self.updated_at).isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<ShoppingItem {self.id} {self.name!r}>"