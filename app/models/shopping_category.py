# app/models/shopping_category.py
from app.extensions import db

class ShoppingCategory(db.Model):
    __tablename__ = "shopping_categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    list_id = db.Column(db.Integer, db.ForeignKey("shopping_lists.id"), nullable=False, index=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    shopping_list = db.relationship("ShoppingList", back_populates="categories")
    # Parent -> children: a category owns many items
    items = db.relationship(
        "ShoppingItem",
        back_populates="category",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    __table_args__ = (
        # Ensure each list can’t have duplicate category names
        db.UniqueConstraint("list_id", "name", name="uq_category_list_id_name"),
    )

    def to_dict(self, include_items: bool = False):
        base = {
            "id": self.id,
            "name": self.name,
            "listId": self.list_id,
            "items": [item.to_dict() for item in self.items],
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }
        if include_items:
            base["items"] = [i.to_dict() for i in self.items]
        return base

    def __repr__(self):
        return f"<ShoppingCategory {self.id} {self.name!r}>"
