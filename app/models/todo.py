
from app.extensions import db

class Todo(db.Model):
    __tablename__ = "todos"

    id = db.Column(db.Integer, primary_key=True)
    list_id = db.Column(db.Integer, db.ForeignKey("todo_lists.id"), nullable=False)
    title = db.Column(db.String, nullable=False)
    description=db.Column(db.Text)
    status=db.Column(db.Text)
    priority=db.Column(db.Text)
    due_date=db.Column(db.Date, nullable=True)
    assigned_to_id=db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    sort_index = db.Column(db.Integer, nullable=False, default=0)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    todo_list=db.relationship("TodoList", back_populates="todos")
    assigned_to=db.relationship("User", back_populates="todos")

    def to_dict(self):
        return {
            "id": self.id,
            "listId": self.list_id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "priority": self.priority,
            "dueDate": self.due_date.isoformat() if self.due_date else None,
            "assignedToId": self.assigned_to_id,
            "notes": self.notes,
            "sortIndex": self.sort_index,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at
        }

    def __repr__(self):
        return f"Todo {self.id}"