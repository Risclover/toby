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
    creator_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    
    # Fields
    name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, nullable=True)
    unit = db.Column(db.String(50), nullable=True)
    notes = db.Column(db.Text)
    is_checked = db.Column(db.Boolean, default=False)
    completed_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    # Relationships
    shopping_list = db.relationship("ShoppingList", back_populates="items")
    category = db.relationship("ShoppingCategory", back_populates="items")

    completed_by = db.relationship(
        "User",
        foreign_keys=[completed_by_id],
        back_populates="completed_shopping_items"
    )

    creator = db.relationship(
        "User",
        foreign_keys=[creator_id],
        back_populates="created_shopping_items"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "listId": self.list_id,
            "categoryId": self.category_id,
            "creatorId": self.creator_id,
            "category": self.category.name if self.category else None,
            "name": self.name,
            "quantity": self.quantity,
            "unit": self.unit,
            "isChecked": self.is_checked,
            "notes": self.notes,
            "completedById": self.completed_by_id,
            "createdAt": utc_datetime_to_local(current_user, self.created_at).isoformat() if self.created_at else None,
            "updatedAt": utc_datetime_to_local(current_user, self.updated_at).isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<ShoppingItem {self.id} {self.name!r}>"