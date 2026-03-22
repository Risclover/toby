# app/routes/task_routes.py
from flask import Blueprint, request, jsonify, abort
from app.models import Task
from app.extensions import db
from datetime import datetime, date
from flask_login import current_user
from app.utils.reminder_utils import create_task_due_reminders
from app.utils.activity_service import ActivityService
import pytz

task_routes = Blueprint("tasks", __name__)

def parse_due_date(val: str) -> datetime:
    # Accept 'YYYY-MM-DD' (date only)
    if len(val) == 10 and val.count('-') == 2:
        return datetime.fromisoformat(val)
    
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
        task.completed_by_id = current_user.id
    elif completed is False:
        task.status = "in_progress"
        task.completed_at = None
        task.completed_by_id = None
    elif data.get("status") in {"completed", "in_progress", "pending"}:
        task.status = data["status"]
        if task.status == "completed":
            task.completed_at = datetime.utcnow()
            task.completed_by_id = current_user.id
    else:
        return jsonify({"error": "Provide boolean 'completed' or valid 'status'"}), 400

    ActivityService.record(
        household_id=task.tasklist.household_id,
        actor_id=current_user.id,
        action="completed" if task.status == "completed" else "uncompleted",
        entity_type="task",
        entity_id=task.id,
        entity_label=task.title,
        event_metadata={"listId": task.list_id, "listTitle": task.tasklist.title},
    )

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

    # handle due_date with timezone
    if "dueDate" in data:
        s = data["dueDate"]
        if s:
            timezone_str = data.get("timezone") or current_user.timezone or "UTC"
            user_tz = pytz.timezone(timezone_str)
            local_due_date = datetime.fromisoformat(s)
            task.due_date = user_tz.localize(local_due_date).astimezone(pytz.UTC).date()
        else:
            task.due_date = None

    # create or update automatic reminders
    timezone_str = data.get("timezone") or current_user.timezone or "UTC"
    user_tz = pytz.timezone(timezone_str)
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
    task = Task.query.get_or_404(id)
    task.is_important = not task.is_important
    db.session.commit()
    return jsonify(task.to_dict())


@task_routes.route("/<int:id>", methods=["DELETE"])
def delete_task(id):
    task = Task.query.get_or_404(id)

    ActivityService.record(
        household_id=task.tasklist.household_id,
        actor_id=current_user.id,
        action="deleted",
        entity_type="task",
        entity_id=task.id,
        entity_label=task.title,
        event_metadata={"listId": task.list_id, "listTitle": task.tasklist.title},
    )

    task.delete()
    db.session.commit()
    return {"message": f"Task (id: {task.id}) deleted from database"}