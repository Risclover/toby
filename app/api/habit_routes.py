from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required
from app.extensions import db
from app.models import Habit, HabitCompletion
from datetime import date

habit_routes = Blueprint("habits", __name__)

@habit_routes.route("", methods=["POST"])
@login_required
def create_habit():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()

    if not name:
        return jsonify({ "error": "Name is required" }), 400

    habit = Habit(
        user_id=current_user.id,
        name=name,
        description=data.get("description"),
        color=data.get("color"),
        is_private=data.get("isPrivate", False),
    )

    db.session.add(habit)
    db.session.commit()

    return jsonify(habit.to_dict()), 201

@habit_routes.route("/<int:habit_id>", methods=["PUT"])
@login_required
def update_habit(habit_id):
    habit = Habit.query.get_or_404(habit_id)

    if habit.user_id != current_user.id:
        return jsonify({ "error": "Forbidden" }), 403

    data = request.get_json() or {}

    if "name" in data:
        name = (data["name"] or "").strip()
        if not name:
            return jsonify({ "error": "Name cannot be empty" }), 400
        habit.name = name
    
    if "description" in data:
        habit.description = data["description"]
    
    if "color" in data:
        habit.color = data["color"]

    if "isPrivate" in data:
        habit.is_private = bool(data["isPrivate"])

    db.session.commit()

    return jsonify(habit.to_dict()), 200

@habit_routes.route("<int:habit_id>", methods=["DELETE"])
@login_required
def delete_habit(habit_id):
    habit = Habit.query.get_or_404(habit_id)

    if habit.user_id != current_user.id:
        return jsonify({ "error": "Forbidden" }), 403

    habit.is_active = False
    db.session.commit()

    return jsonify({ "message": "Habit deleted" }), 200

@habit_routes.route("/<int:habit_id>/complete", methods=["POST"])
@login_required
def complete_habit(habit_id):
    habit = Habit.query.get_or_404(habit_id)

    if habit.user_id != current_user.id:
        return jsonify({"error": "Forbidden"}), 403

    today = date.today()
    exists = HabitCompletion.query.filter_by(
        habit_id=habit_id,
        local_date=today
    ).first()

    if not exists:
        db.session.add(HabitCompletion(habit_id=habit_id, local_date=today))
        db.session.commit()

    return jsonify({"habitId": habit_id, "localDate": today.isoformat(), "completed": True}), 200

@habit_routes.route("/<int:habit_id>/complete", methods=["DELETE"])
@login_required
def uncomplete_habit(habit_id):
    habit = Habit.query.get_or_404(habit_id)

    if habit.user_id != current_user.id:
        return jsonify({"error": "Forbidden"}), 403

    today = date.today()
    completion = HabitCompletion.query.filter_by(
        habit_id=habit_id,
        local_date=today
    ).first()

    if completion:
        db.session.delete(completion)
        db.session.commit()

    return jsonify({"habitId": habit_id, "localDate": today.isoformat(), "completed": False}), 200