from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from app.models.activity_event import ActivityEvent
from app.models import Household
from datetime import datetime

activity_routes = Blueprint("activity", __name__)


def is_visible_to_user(event, user_id, admin_id):
    if event.audience_ids is None:
        return True
    if user_id == admin_id:
        return True
    return user_id in event.audience_ids


@activity_routes.route("/<int:household_id>", methods=["GET"])
@login_required
def get_activity(household_id):
    if current_user.household_id != household_id:
        return jsonify({"error": "Forbidden"}), 403

    limit = min(int(request.args.get("limit", 20)), 100)
    cursor = request.args.get("cursor")
    actor_id = request.args.get("actor_id", type=int)

    household = Household.query.get_or_404(household_id)

    q = (
        ActivityEvent.query
        .filter_by(household_id=household_id)
        .order_by(ActivityEvent.created_at.desc(), ActivityEvent.id.desc())
    )

    if actor_id:
        q = q.filter_by(actor_id=actor_id)

    if cursor:
        try:
            cursor_dt = datetime.fromisoformat(cursor)
            q = q.filter(ActivityEvent.created_at < cursor_dt)
        except ValueError:
            return jsonify({"error": "Invalid cursor"}), 400

    events = q.limit(limit + 1).all()
    has_next = len(events) > limit
    events = events[:limit]

    visible = [e for e in events if is_visible_to_user(e, current_user.id, household.admin_id)]

    next_cursor = visible[-1].created_at.isoformat() if has_next and visible else None

    return jsonify({"items": [e.to_dict() for e in visible], "nextCursor": next_cursor}), 200