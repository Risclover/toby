from flask import Blueprint, request, jsonify, abort
from app.models import Task
from app.extensions import db
from datetime import datetime, date
from flask_login import current_user, login_required
from app.utils.reminder_utils import create_task_due_reminders

task_routes = Blueprint("tasks", __name__)

def parse_due_date(val: str) -> datetime:
    # Accept 'YYYY-MM-DD' (date only)
    if len(val) == 10 and val.count('-') == 2:
        return datetime.fromisoformat(val)  # becomes midnight
    
    # Normalize 'Z' to '+00:00'
    if val.endswith('Z'):
        val = val.replace('Z', '+00:00')
    return datetime.fromisoformat(val)


@task_routes.route("/<int:id>/completed", methods=["PUT"])
def update_task_status(id):
    task = Task.query.get_or_404(id)
    data = request.get_json(silent=True) or {}

    completed = data.get("completed")

    if completed is True:
        task.status = "completed"
        task.completed_at = datetime.utcnow()
    elif completed is False:
        # or "pending" if that's what you want
        task.status = "in_progress"
        task.completed_at = None
    elif data.get("status") in {"completed", "in_progress", "pending"}:
        task.status = data["status"]
        if task.status == "completed":
            task.completed_at = datetime.utcnow()
    else:
        return jsonify({"error": "Provide boolean 'completed' or valid 'status'"}), 400

    db.session.commit()
    return jsonify(task.to_dict()), 200

@task_routes.route("/<int:id>", methods=["PATCH", "PUT"])
def update_task(id):
    task = Task.query.get_or_404(id)
    data = request.get_json(silent=True) or {}

    for field in ("title", "description", "isImportant", "status"):
        if field in data:
            setattr(task, field, data[field])

    if "notes" in data:
        task.notes = data["notes"]

    if "assignedToId" in data:
        task.assigned_to_id = data["assignedToId"]

    if "dueDate" in data:
        s = data["dueDate"]
        task.due_date = date.fromisoformat(s) if s else None

    # create or update automatic reminders
    create_task_due_reminders(task)

    db.session.commit()
    db.session.refresh(task)
    return jsonify(task.to_dict()), 200


@task_routes.route("/<int:id>", methods=["GET"])
def get_task(id):
    task = Task.query.get(id)
    return jsonify(task.to_dict()), 200


@task_routes.route("/<int:id>/importance", methods=["PUT"])
def toggle_importance(id):
    """
    Toggle the importance of an announcement
    """
    task = Task.query.get(id)
    if not task:
        abort(404, description="Task not found")
    
    user_id = int(current_user.get_id())
    
    task.is_important = not task.is_important
    db.session.commit()
    return jsonify(task.to_dict())

@task_routes.route("/<int:id>", methods=["DELETE"])
def delete_task(id):
    """
    Delete task
    """
    task = Task.query.get_or_404(id)
    task.delete()
    db.session.commit()

    return {"message": f"Task (id: {task.id}) deleted from database"}
