# app/models/shopping_list.py
from app.extensions import db
from app.utils.timezone import utc_datetime_to_local
from flask_login import current_user

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
        db.Index("ix_shopping_lists_household_id_id", "household_id", "id"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "householdId": self.household_id,
            "categories": [category.to_dict() for category in self.categories],
            "createdAt": utc_datetime_to_local(current_user, self.created_at).isoformat() if self.created_at else None,
            "updatedAt": utc_datetime_to_local(current_user, self.updated_at).isoformat() if self.updated_at else None,
            "items": [item.to_dict() for item in self.items]
        }

    def __repr__(self):
        return f"<ShoppingList {self.id} {self.title!r}>"