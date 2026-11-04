from flask import Blueprint, request, jsonify, current_app
from flask_login import current_user, login_required
from app.extensions import db
from app.models import Notification, User
from datetime import date, datetime, timedelta, timezone
from sqlalchemy import and_, or_

import base64

notification_routes = Blueprint("notifications", __name__)

DEFAULT_LIMIT = 20
MAX_LIMIT = 100
UNSEEN_CAP = 21

def _encode_cursor(notification):
    """Opaque, URL-safe bookmark: this row's (created_at, id)."""
    raw = f"{notification.created_at.isoformat()}|{notification.id}"
    return base64.urlsafe_b64encode(raw.encode()).decode()


def _decode_cursor(cursor):
    """Inverse of _encode_cursor. Raises ValueError if the cursor is malformed."""
    created_at, notification_id = base64.urlsafe_b64decode(cursor.encode()).decode().split("|")
    return datetime.fromisoformat(created_at), int(notification_id)

@notification_routes.route("", methods=["GET"])
@login_required
def get_notifications():
    limit = min(request.args.get("limit", default=DEFAULT_LIMIT, type=int), MAX_LIMIT)
    cursor = request.args.get("cursor")

    query = (
        Notification.query
        .filter_by(recipient_id=current_user.id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
    )

    if cursor:
        try:
            cursor_created_at, cursor_id = _decode_cursor(cursor)
        except ValueError:
            return jsonify({"error": "Invalid cursor"}), 400
        query = query.filter(
            or_(
                Notification.created_at < cursor_created_at,
                and_(Notification.created_at == cursor_created_at, Notification.id < cursor_id),
            )
        )

    rows = query.limit(limit + 1).all()      # one extra row, to know if there's a next page
    has_next = len(rows) > limit
    rows = rows[:limit]
    next_cursor = _encode_cursor(rows[-1]) if has_next else None

    return jsonify({"items": [n.to_dict() for n in rows], "nextCursor": next_cursor}), 200


@notification_routes.route("/unseen-count", methods=["GET"])
@login_required
def get_unseen_count():
    query = Notification.query.filter(
        Notification.recipient_id == current_user.id,
        Notification.read_at.is_(None),
    )

    last_seen = current_user.notifications_last_seen_at
    if last_seen is not None:
        query = query.filter(Notification.created_at > last_seen)

    # limit() before count() makes SQL stop counting at the cap
    count = query.limit(UNSEEN_CAP).count()
    return jsonify({"count": count}), 200