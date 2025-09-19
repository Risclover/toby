from app.extensions import db
from sqlalchemy import Index

class TodoListMember(db.Model):
    __tablename__ = "todo_list_members"

    todo_list_id = db.Column(db.Integer, db.ForeignKey("todo_lists.id", ondelete="CASCADE"), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    todo_list = db.relationship("TodoList", back_populates="member_links")
    user = db.relationship("User", back_populates="todo_list_memberships")

    __table_args__ = (
        # Drop this line ↓ because the PK already covers todo_list_id
        # Index("ix_tlm_todo_list_id", "todo_list_id"),
        Index("ix_tlm_user_id", "user_id"),
    )