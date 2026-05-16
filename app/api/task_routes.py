# app/routes/task_routes.py
from flask import Blueprint, request, jsonify, abort
from app.models import Task, Household
from app.extensions import db
from datetime import datetime, date
from flask_login import current_user, login_required
from app.utils.reminder_utils import create_task_due_reminders
from app.utils.activity_service import ActivityService
from app.api.tasklist_routes import get_tasklist_audience_ids
import pytz

task_routes = Blueprint("tasks", __name__)

def is_household_admin(household_id):
    household = Household.query.get(household_id)
    return household and current_user.id == household.admin_id

def parse_due_date(val: str) -> datetime:
    if len(val) == 10 and val.count('-') == 2:
        return datetime.fromisoformat(val)
    if val.endswith('Z'):
        val = val.replace('Z', '+00:00')
    return datetime.fromisoformat(val)


@task_routes.route("/<int:id>/completed", methods=["PUT"])
@login_required
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

    tasklist = task.tasklist
    action = "completed" if task.status == "completed" else "uncompleted"

    ActivityService.record(
        household_id=tasklist.household_id,
        actor_id=current_user.id,
        action=action,
        entity_type="task",
        entity_id=task.id,
        entity_label=task.title,
        event_metadata={"listId": task.list_id, "listTitle": tasklist.title},
        audience_ids=get_tasklist_audience_ids(tasklist),
        batch_key=f"task-{action}-{tasklist.id}",
    )

    db.session.commit()
    return jsonify(task.to_dict()), 200


@task_routes.route("/<int:id>", methods=["PATCH", "PUT"])
@login_required
def update_task(id):
    task = Task.query.get_or_404(id)

    tasklist = task.tasklist
    is_all_members = tasklist.all_members or task.assigned_to_id is None

    if (
        current_user.id != task.creator_id
        and current_user.id != task.assigned_to_id
        and not is_all_members
        and not is_household_admin(tasklist.household_id)
    ):
        return jsonify({"error": "Forbidden"}), 403

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
        if s:
            timezone_str = data.get("timezone") or current_user.timezone or "UTC"
            user_tz = pytz.timezone(timezone_str)
            local_due_date = datetime.fromisoformat(s)
            task.due_date = user_tz.localize(local_due_date).astimezone(pytz.UTC).date()
        else:
            task.due_date = None

    timezone_str = data.get("timezone") or current_user.timezone or "UTC"
    create_task_due_reminders(task)

    db.session.commit()
    db.session.refresh(task)
    return jsonify(task.to_dict()), 200


@task_routes.route("/<int:id>", methods=["GET"])
def get_task(id):
    task = Task.query.get(id)
    return jsonify(task.to_dict()), 200


@task_routes.route("/<int:id>/importance", methods=["PUT"])
@login_required
def toggle_importance(id):
    task = Task.query.get_or_404(id)

    tasklist = task.tasklist
    is_all_members = tasklist.all_members or task.assigned_to_id is None

    if (
        current_user.id != task.creator_id
        and current_user.id != task.assigned_to_id
        and not is_all_members
        and not is_household_admin(tasklist.household_id)
    ):
        return jsonify({"error": "Forbidden"}), 403

    task.is_important = not task.is_important
    db.session.commit()
    return jsonify(task.to_dict())


@task_routes.route("/<int:id>", methods=["DELETE"])
@login_required
def delete_task(id):
    task = Task.query.get_or_404(id)

    if current_user.id != task.creator_id and not is_household_admin(task.tasklist.household_id):
        return jsonify({"error": "Forbidden"}), 403

    tasklist = task.tasklist

    ActivityService.record(
        household_id=tasklist.household_id,
        actor_id=current_user.id,
        action="deleted",
        entity_type="task",
        entity_id=task.id,
        entity_label=task.title,
        event_metadata={"listId": task.list_id, "listTitle": tasklist.title},
        audience_ids=get_tasklist_audience_ids(tasklist),
        batch_key=f"task-deleted-{tasklist.id}",
    )

    task.delete()
    db.session.commit()
    return {"message": f"Task (id: {task.id}) deleted from database"}