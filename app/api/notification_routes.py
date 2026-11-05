import base64
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required
from sqlalchemy import and_, or_
from app.extensions import db
from app.models.notification import Notification
from app.services import NotificationService

notification_routes = Blueprint("notifications", __name__)

DEFAULT_LIMIT = 20
MAX_LIMIT = 100
UNSEEN_CAP = 21  # one past the 20 the bell shows, so the frontend can render "20+"


def _encode_cursor(notification):
    """Opaque, URL-safe bookmark: this row's (created_at, id)."""
    raw = f"{notification.created_at.isoformat()}|{notification.id}"
    return base64.urlsafe_b64encode(raw.encode()).decode()


def _decode_cursor(cursor):
    """Inverse of _encode_cursor. Raises ValueError if the cursor is malformed."""
    created_at, notification_id = base64.urlsafe_b64decode(cursor.encode()).decode().split("|")
    return datetime.fromisoformat(created_at), int(notification_id)


def _get_my_notification(notification_id):
    """The notification, only if it belongs to the current user."""
    return Notification.query.filter_by(
        id=notification_id, recipient_id=current_user.id
    ).first()


@notification_routes.route("", methods=["GET"])
@login_required
def get_notifications():
    NotificationService.prune_read(current_user.id)
    db.session.commit()

    limit = request.args.get("limit", default=DEFAULT_LIMIT, type=int)
    limit = max(1, min(limit, MAX_LIMIT))
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
        query = query.filter(or_(
            Notification.created_at < cursor_created_at,
            and_(Notification.created_at == cursor_created_at, Notification.id < cursor_id),
        ))

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

    count = query.limit(UNSEEN_CAP).count()
    return jsonify({"count": count}), 200


@notification_routes.route("/seen", methods=["POST"])
@login_required
def mark_seen():
    """Clears the bell badge. Does not mark any notification as read."""
    current_user.notifications_last_seen_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({"lastSeenAt": current_user.notifications_last_seen_at.isoformat()}), 200


@notification_routes.route("/<int:notification_id>/read", methods=["POST"])
@login_required
def mark_read(notification_id):
    notification = _get_my_notification(notification_id)
    if notification is None:
        return jsonify({"error": "Notification not found"}), 404

    if notification.read_at is None:  
        notification.read_at = datetime.now(timezone.utc)
        db.session.commit()
    return jsonify(notification.to_dict()), 200


@notification_routes.route("/<int:notification_id>/unread", methods=["POST"])
@login_required
def mark_unread(notification_id):
    notification = _get_my_notification(notification_id)
    if notification is None:
        return jsonify({"error": "Notification not found"}), 404

    notification.read_at = None
    db.session.commit()
    return jsonify(notification.to_dict()), 200


@notification_routes.route("/read-all", methods=["POST"])
@login_required
def mark_all_read():
    updated = (
        Notification.query
        .filter(
            Notification.recipient_id == current_user.id,
            Notification.read_at.is_(None),
        )
        .update({"read_at": datetime.now(timezone.utc)}, synchronize_session=False)
    )
    db.session.commit()
    return jsonify({"updated": updated}), 200