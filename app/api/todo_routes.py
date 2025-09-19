from flask import Blueprint, request, jsonify
from app.models import Todo
from app.extensions import db

todo_routes = Blueprint("todos", __name__)

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

@todo_routes.route("/<int:id>", methods=["PUT"])
def edit_todo(id):
    todo = Todo.query.get(id)
    data = request.get_json()

    title = data["title"]

    todo.title = title

    db.session.commit()
    return jsonify(todo.to_dict()), 200