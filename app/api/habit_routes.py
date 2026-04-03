from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required
from app.extensions import db
from app.models import Habit, HabitCompletion
from datetime import date, timedelta
from calendar import monthrange

habit_routes = Blueprint("habits", __name__)

def get_target_date(data: dict) -> tuple[date | None, str | None]:
    """Returns (date, error_message). Error is None if valid."""
    raw = data.get("localDate")
    if not raw:
        return date.today(), None
    
    try:
        target = date.fromisoformat(raw)
    except ValueError:
        return None, "Invalid date format"

    today = date.today()
    yesterday = today - timedelta(days=1)

    if target > today:
        return None, "Cannot complete a future habit"
    if target < yesterday:
        return None, "This day can no longer be edited"

    return target, None

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

    data = request.get_json() or {}
    local_date, error = get_target_date(data)
    if error:
        return jsonify({"error": error}), 400

    exists = HabitCompletion.query.filter_by(
        habit_id=habit_id, local_date=local_date
    ).first()

    if not exists:
        db.session.add(HabitCompletion(habit_id=habit_id, local_date=local_date))
        db.session.commit()

    return jsonify({"habitId": habit_id, "localDate": local_date.isoformat(), "completed": True}), 200


@habit_routes.route("/<int:habit_id>/complete", methods=["DELETE"])
@login_required
def uncomplete_habit(habit_id):
    habit = Habit.query.get_or_404(habit_id)
    if habit.user_id != current_user.id:
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json() or {}
    local_date, error = get_target_date(data)
    if error:
        return jsonify({"error": error}), 400

    completion = HabitCompletion.query.filter_by(
        habit_id=habit_id, local_date=local_date
    ).first()

    if completion:
        db.session.delete(completion)
        db.session.commit()

    return jsonify({"habitId": habit_id, "localDate": local_date.isoformat(), "completed": False}), 200

@habit_routes.route("/completions", methods=["GET"])
@login_required
def get_monthly_habit_completions():
    year = request.args.get("year", type=int)
    month = request.args.get("month", type=int)
    target_user_id = request.args.get("userId", type=int) or current_user.id

    if not year or not month or not (1 <= month <= 12):
        return jsonify({"error": "Valid year and month required"}), 400

    # If requesting another user's data, verify same household
    if target_user_id != current_user.id:
        from app.models import User
        target_user = User.query.get_or_404(target_user_id)
        if target_user.household_id != current_user.household_id:
            return jsonify({"error": "Forbidden"}), 403

    _, last_day = monthrange(year, month)
    start = date(year, month, 1)
    end = date(year, month, last_day)

    habits = Habit.query.filter_by(user_id=target_user_id, is_active=True).all()
    habit_ids = [h.id for h in habits]

    completions = HabitCompletion.query.filter(
        HabitCompletion.habit_id.in_(habit_ids),
        HabitCompletion.local_date >= start,
        HabitCompletion.local_date <= end,
    ).all()

    result: dict[int, list[str]] = {h.id: [] for h in habits}
    for c in completions:
        result[c.habit_id].append(c.local_date.isoformat())

    return jsonify(result), 200