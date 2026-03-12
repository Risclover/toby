from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from app.models.activity_event import ActivityEvent

activity_routes = Blueprint("activity", __name__)


@activity_routes.route("/<int:household_id>", methods=["GET"])
@login_required
def get_activity(household_id):
    if current_user.household_id != household_id:
        return jsonify({"error": "Forbidden: You are not a member of this household"}), 403

    limit = min(int(request.args.get("limit", 20)), 100)
    cursor = request.args.get("cursor")

    q = (
        ActivityEvent.query
        .filter_by(household_id=household_id)
        .order_by(ActivityEvent.created_at.desc(), ActivityEvent.id.desc())
    )

    if cursor:
        try:
            from datetime import datetime, timezone
            cursor_dt = datetime.fromisoformat(cursor)
            q = q.filter(ActivityEvent.created_at < cursor_dt)
        except ValueError:
            return jsonify({"error": "Invalid cursor"}), 400

    events = q.limit(limit + 1).all()

    has_next = len(events) > limit
    events = events[:limit]

    next_cursor = events[-1].created_at.isoformat() if has_next and events else None

    return jsonify({
        "items": [e.to_dict() for e in events],
        "nextCursor": next_cursor,
    }), 200