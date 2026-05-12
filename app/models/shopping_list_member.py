from app.extensions import db
from sqlalchemy import Index

class ShoppingListMember(db.Model):
    __tablename__ = "shopping_list_members"

    list_id = db.Column(db.Integer, db.ForeignKey("shopping_lists.id", ondelete="CASCADE"), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    shopping_list = db.relationship("ShoppingList", back_populates="member_links")
    user = db.relationship("User", back_populates="shopping_list_memberships")

    __table_args__ = (
        # Drop this line ↓ because the PK already covers tasklist_id
        # Index("ix_tlm_tasklist_id", "tasklist_id"),
        Index("ix_slm_user_id", "user_id"),
    )