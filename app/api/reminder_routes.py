from flask import Blueprint, request, jsonify, abort, current_app
from flask_login import current_user, login_required
from app.extensions import db
from app.models import Reminder, User, Household, ReminderType, ReminderAssignment
from datetime import datetime, timezone
from app.utils.parse_datetime import parse_datetime
from app.utils.timezone import get_user_timezone
import pytz

reminder_routes = Blueprint("reminders", __name__)


def deactivate_automatic_reminders(source_type, source_id):
    Reminder.query.filter_by(
        source_entity_type=source_type,
        source_entity_id=source_id,
        is_automatic=True,
        is_active=True,
    ).update({"is_active": False})
    db.session.commit()


@reminder_routes.route("/<int:id>", methods=["GET"])
def get_reminder(id):
    reminder = Reminder.query.get(id)

    if not reminder:
        abort(404, description="Reminder not found")

    return jsonify(reminder.to_dict()), 200


@reminder_routes.route("/internal", methods=["POST"])
def create_or_update_automatic_reminder():
    if request.headers.get("X-Internal-Token") != current_app.config["INTERNAL_API_TOKEN"]:
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json()

    required_fields = [
        "householdId",
        "message",
        "reminderType",
        "sourceEntityType",
        "sourceEntityId",
    ]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing {field}"}), 400

    # ---- TIMEZONE FIX (A) START ----
    trigger_at = None
    if data.get("triggerAt"):
        parsed = parse_datetime(data["triggerAt"])

        if parsed.tzinfo is None:
            # assume creator's timezone, then convert to UTC
            user_tz = get_user_timezone(current_user)
            parsed = user_tz.localize(parsed)

        trigger_at = parsed.astimezone(pytz.UTC)
    # ---- TIMEZONE FIX (A) END ----

    reminder = Reminder.query.filter_by(
        household_id=data["householdId"],
        source_entity_type=data["sourceEntityType"],
        source_entity_id=data["sourceEntityId"],
        reminder_type=ReminderType(data["reminderType"]),
        is_automatic=True,
        trigger_at=trigger_at,
    ).first()

    if reminder:
        reminder.message = data["message"]
        reminder.is_active = True
    else:
        reminder = Reminder(
            household_id=data["householdId"],
            message=data["message"],
            reminder_type=ReminderType(data["reminderType"]),
            is_automatic=True,
            source_entity_type=data["sourceEntityType"],
            source_entity_id=data["sourceEntityId"],
            trigger_at=trigger_at,
        )
        db.session.add(reminder)

    db.session.commit()
    return jsonify(reminder.to_dict()), 201


@reminder_routes.route("/<int:id>/seen", methods=["PATCH"])
@login_required
def mark_reminder_seen(id):
    assignment = ReminderAssignment.query.filter_by(
        reminder_id=id,
        user_id=current_user.id,
    ).first()

    if not assignment:
        return jsonify({"error": "Reminder assignment not found"}), 404

    assignment.seen = True
    db.session.commit()

    return jsonify({"success": True}), 200


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

    if "reminderBody" in data:
        reminder.message = data["reminderBody"]

    # ---- TIMEZONE FIX (A) START ----
    if "triggerAt" in data:
        parsed = parse_datetime(data["triggerAt"])

        if parsed is None:
            reminder.trigger_at = None
        else:
            if parsed.tzinfo is None:
                user_tz = get_user_timezone(current_user)
                parsed = user_tz.localize(parsed)

            reminder.trigger_at = parsed.astimezone(pytz.UTC)
    # ---- TIMEZONE FIX (A) END ----

    if "assignedToIds" in data:
        assigned_user_ids = set(data["assignedToIds"])

        existing_assignments = {a.user_id: a for a in reminder.assignments}
        existing_user_ids = set(existing_assignments.keys())

        for user_id in assigned_user_ids - existing_user_ids:
            db.session.add(
                ReminderAssignment(
                    reminder_id=reminder.id,
                    user_id=user_id,
                    seen=False,
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