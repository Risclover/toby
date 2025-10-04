# app/models/shopping_list.py
from app.extensions import db

class ShoppingList(db.Model):
    __tablename__ = "shopping_lists"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(50), nullable=False)
    household_id = db.Column(db.Integer, db.ForeignKey("households.id"), nullable=True, index=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    # Parent -> children relationships (own the cascade)
    items = db.relationship(
        "ShoppingItem",
        back_populates="shopping_list",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    categories = db.relationship(
        "ShoppingCategory",
        back_populates="shopping_list",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    household = db.relationship("Household", back_populates="shopping_lists")

    __table_args__ = (
        # Optional: make category names unique within a list
        # (enforced on ShoppingCategory below)
        db.Index("ix_shopping_lists_household_id_id", "household_id", "id"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "householdId": self.household_id,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
            "items": [item.to_dict() for item in self.items]
        }

    def __repr__(self):
        return f"<ShoppingList {self.id} {self.title!r}>"
