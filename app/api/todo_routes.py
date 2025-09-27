from flask import Blueprint, request, jsonify
from app.models import Todo
from app.extensions import db
from datetime import datetime, date

todo_routes = Blueprint("todos", __name__)

def parse_due_date(val: str) -> datetime:
    # Accept 'YYYY-MM-DD' (date only)
    if len(val) == 10 and val.count('-') == 2:
        return datetime.fromisoformat(val)  # becomes midnight
    
    # Normalize 'Z' to '+00:00'
    if val.endswith('Z'):
        val = val.replace('Z', '+00:00')
    return datetime.fromisoformat(val)


@todo_routes.route("/<int:id>/completed", methods=["PUT"])
def complete_todo(id):
    todo = Todo.query.get_or_404(id)
    data = request.get_json(silent=True) or {}

    completed = data.get("completed")

    if completed is True:
        todo.status = "completed"
    elif completed is False:
        # or "pending" if that's what you want
        todo.status = "in_progress"
    elif data.get("status") in {"completed", "in_progress", "pending"}:
        todo.status = data["status"]
    else:
        return jsonify({"error": "Provide boolean 'completed' or valid 'status'"}), 400

    db.session.commit()
    return jsonify(todo.to_dict()), 200

@todo_routes.route("/<int:id>", methods=["PATCH", "PUT"])
def edit_todo(id):
    todo = Todo.query.get_or_404(id)
    data = request.get_json(silent=True) or {}

    for field in ("title", "description", "priority", "status"):
        if field in data:
            setattr(todo, field, data[field])

    if "notes" in data:
        setattr(todo, "notes", data["notes"])

    if "assignedToId" in data:
        setattr(todo, "assigned_to_id", data["assignedToId"])

    if "dueDate" in data:
        s = data["dueDate"]
        if not s:
            todo.due_date = None
        else:
            # expect "YYYY-MM-DD"
            todo.due_date = date.fromisoformat(s)

    db.session.commit()
    return jsonify(todo.to_dict()), 200


@todo_routes.route("/<int:id>", methods=["GET"])
def get_todo(id):
    todo = Todo.query.get(id)
    return jsonify(todo.to_dict()), 200