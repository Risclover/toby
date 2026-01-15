from app.extensions import db
from sqlalchemy import Index

class TasklistMember(db.Model):
    __tablename__ = "tasklist_members"

    tasklist_id = db.Column(db.Integer, db.ForeignKey("tasklists.id", ondelete="CASCADE"), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    tasklist = db.relationship("Tasklist", back_populates="member_links")
    user = db.relationship("User", back_populates="tasklist_memberships")

    __table_args__ = (
        # Drop this line ↓ because the PK already covers tasklist_id
        # Index("ix_tlm_tasklist_id", "tasklist_id"),
        Index("ix_tlm_user_id", "user_id"),
    )