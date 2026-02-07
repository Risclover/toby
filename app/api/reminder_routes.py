from flask import Blueprint, request, jsonify, abort
from flask_login import current_user, login_required
from app.extensions import db
from app.models import Reminder, User, Household, ReminderType
from datetime import datetime, timedelta, timezone
from app.utils.parse_datetime import parse_datetime

reminder_routes = Blueprint("reminders", __name__)


@reminder_routes.route("/<int:id>", methods=["GET"])
def get_reminder(id):
    """
    Fetch specific reminder by id
    """
    reminder = Reminder.query.get(id)

    if not reminder:
        abort(404, description="Reminder not found")

    return jsonify(reminder.to_dict()), 201

@reminder_routes.route("/internal", methods=["POST"])
def create_automatic_reminder():
    # simple internal auth check
    if request.headers.get("X-Internal-Token") != current_app.config["INTERNAL_API_TOKEN"]:
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json()

    # optional: minimal validation
    required_fields = ["householdId", "body", "sourceEntityType", "sourceEntityId", "reminderType"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing {field}"}), 400

    reminder = Reminder(
        household_id=data["householdId"],
        title=data.get("title"),
        body=data["reminderBody"],
        reminder_type=ReminderType(data["reminderType"]),
        is_automatic=True,
        source_entity_type=data["sourceEntityType"],
        source_entity_id=data["sourceEntityId"],
        trigger_at=parse_datetime(data.get("triggerAt")),
        expires_at=parse_datetime(data.get("expiresAt")),
    )

    db.session.add(reminder)
    db.session.commit()

    return jsonify(reminder.to_dict()), 201

@reminder_routes.route("/<int:id>/seen", methods=["PATCH"])
@login_required
def mark_reminder_seen(id):
    reminder = Reminder.query.get(id)

    if not reminder:
        return jsonify({"error": "Reminder not found"}), 404

    if reminder.assigned_to_id and reminder.assigned_to_id != current_user.id:
        return jsonify({"error": "Forbidden"}), 403

    reminder.seen = True
    db.session.commit()

    return jsonify(reminder.to_dict()), 200

@reminder_routes.route("/<int:id>", methods=["PATCH"])
@login_required
def update_manual_reminder(id):
    reminder = Reminder.query.get(id)

    if not reminder:
        return jsonify({"error": "Reminder not found"}), 404

    if reminder.is_automatic:
        return jsonify({"error": "Cannot update automatic reminder"}), 403

    if reminder.created_by_id != current_user.id:
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json()

    if "title" in data:
        reminder.title = data["title"]

    if "reminderBody" in data:
        reminder.body = data["reminderBody"]

    if "triggerAt" in data:
        reminder.trigger_at = parse_datetime(data["triggerAt"])

    if "expiresAt" in data:
        reminder.expires_at = parse_datetime(data["expiresAt"])

    if "assignedToIds" in data:
        assigned_user_ids = set(data["assignedToIds"])

        existing_assignments = {
            a.user_id: a for a in reminder.assignments
        }
        existing_user_ids = set(existing_assignments.keys())

        for user_id in assigned_user_ids - existing_user_ids:
            db.session.add(
                ReminderAssignment(
                    reminder_id=reminder.id,
                    user_id=user_id
                )
            )

        for user_id in existing_user_ids - assigned_user_ids:
            db.session.delete(existing_assignments[user_id])

    db.session.commit()
    return jsonify(reminder.to_dict()), 200

@reminder_routes.route("/<int:id>", methods=["DELETE"])
@login_required
def delete_manual_reminder(id):
    reminder = Reminder.query.get(id)

    if not reminder:
        return jsonify({"error": "Reminder not found"}), 404

    if reminder.is_automatic:
        return jsonify({"error": "Cannot delete automatic reminder"}), 403

    if reminder.created_by_id != current_user.id:
        return jsonify({"error": "Forbidden"}), 403

    db.session.delete(reminder)
    db.session.commit()

    return jsonify({"message": "Reminder deleted"}), 200