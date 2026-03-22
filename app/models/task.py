# app/models/task.py
from app.extensions import db
from datetime import datetime
from app.utils.timezone import utc_datetime_to_local
from flask_login import current_user

class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    list_id = db.Column(db.Integer, db.ForeignKey("tasklists.id"), nullable=False)
    creator_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description=db.Column(db.Text)
    status=db.Column(db.Text)
    is_important=db.Column(db.Boolean, default=False)
    due_date=db.Column(db.Date, nullable=True)
    assigned_to_id=db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    completed_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    sort_index = db.Column(db.Integer, nullable=False, default=0)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())
    completed_at = db.Column(db.DateTime, nullable=True)

    tasklist=db.relationship("Tasklist", back_populates="tasks")
    assigned_to = db.relationship(
        "User", 
        foreign_keys=[assigned_to_id],
        back_populates="tasks"
    )
    creator = db.relationship(
        "User", 
        foreign_keys=[creator_id],   
        back_populates="created_tasks"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "listId": self.list_id,
            "creatorId": self.creator_id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "isImportant": self.is_important,
            "dueDate": self.due_date.isoformat() if self.due_date else None,
            "assignedToId": self.assigned_to_id,
            "notes": self.notes,
            "sortIndex": self.sort_index,
            "createdAt": utc_datetime_to_local(current_user, self.created_at).isoformat() if self.created_at else None,
            "updatedAt": utc_datetime_to_local(current_user, self.updated_at).isoformat() if self.updated_at else None,
            "completedAt": utc_datetime_to_local(current_user, self.completed_at).isoformat() if self.completed_at else None,
        }

    def __repr__(self):
        return f"Task {self.id}"