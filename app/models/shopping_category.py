# app/models/shopping_category.py
from app.extensions import db
from app.utils.timezone import utc_datetime_to_local
from flask_login import current_user

class ShoppingCategory(db.Model):
    __tablename__ = "shopping_categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(50), nullable=False)
    list_id = db.Column(db.Integer, db.ForeignKey("shopping_lists.id"), nullable=False, index=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    shopping_list = db.relationship("ShoppingList", back_populates="categories")
    items = db.relationship(
        "ShoppingItem",
        back_populates="category",
        lazy="selectin",
    )

    __table_args__ = (
        db.UniqueConstraint("list_id", "name", name="uq_category_list_id_name"),
    )

    def to_dict(self, include_items: bool = False):
        base = {
            "id": self.id,
            "name": self.name,
            "color": self.color,
            "listId": self.list_id,
            "createdAt": utc_datetime_to_local(current_user, self.created_at).isoformat() if self.created_at else None,
            "updatedAt": utc_datetime_to_local(current_user, self.updated_at).isoformat() if self.updated_at else None,
            "items": [item.to_dict() for item in self.items] if include_items else [],
        }
        return base

    def __repr__(self):
        return f"<ShoppingCategory {self.id} {self.name!r}>"