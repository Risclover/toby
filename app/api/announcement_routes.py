from flask import Blueprint, request, jsonify, abort
from flask_login import current_user
from sqlalchemy import select, or_, and_, func
from sqlalchemy.dialects.postgresql import insert
from app.extensions import db
from app.models import Announcement, AnnouncementSeen, Household
from datetime import datetime, timedelta, timezone
import base64
import pytz

announcement_routes = Blueprint("announcements", __name__)

# # ---------------------------
# # Helpers
# # ---------------------------
# def compute_expires_at(
#     created_at_utc: datetime,
#     ttl_mode: str | None,
#     household_tzid: str | None,
#     ttl_hours: int | None
# ) -> datetime:
#     mode = (ttl_mode or "rolling").lower()

#     if mode == "rolling":
#         hours = ttl_hours or 24
#         return created_at_utc + timedelta(hours=hours)

#     tz = pytz.timezone(household_tzid or "America/Los_Angeles")
#     created_local = created_at_utc.astimezone(tz)
#     next_midnight_local = created_local.replace(
#         hour=0, minute=0, second=0, microsecond=0
#     ) + timedelta(days=1)
#     return next_midnight_local.astimezone(pytz.UTC)

# def encode_cursor(created_at: datetime, announcement_id: int) -> str:
#     raw = f"{created_at.isoformat()}|{announcement_id}".encode("utf-8")
#     return base64.urlsafe_b64encode(raw).decode("utf-8")

# def decode_cursor(cursor_token: str) -> tuple[datetime, int] | None:
#     try:
#         raw = base64.urlsafe_b64decode(cursor_token.encode("utf-8")).decode("utf-8")
#         created_at_str, id_str = raw.split("|", 1)
#         return datetime.fromisoformat(created_at_str), int(id_str)
#     except Exception:
#         return None

# # ---------------------------
# # Seen / Unseen (idempotent)
# # ---------------------------
# @announcement_routes.route("/<int:announcement_id>/seen", methods=["POST"])
# def mark_seen(announcement_id: int):
#     Announcement.query.get_or_404(announcement_id)

#     user_id = int(current_user.get_id()) if hasattr(current_user, "get_id") else current_user.id
#     stmt = (
#         insert(AnnouncementSeen)
#         .values(announcement_id=announcement_id, user_id=user_id)  # seen_at via server_default=now()
#         .on_conflict_do_nothing(index_elements=["announcement_id", "user_id"])
#     )
#     db.session.execute(stmt)
#     db.session.commit()
#     return ("", 204)

# @announcement_routes.route("/<int:announcement_id>/seen", methods=["DELETE"])
# def mark_unseen(announcement_id: int):
#     user_id = int(current_user.get_id()) if hasattr(current_user, "get_id") else current_user.id
#     (
#         db.session.query(AnnouncementSeen)
#         .filter_by(announcement_id=announcement_id, user_id=user_id)
#         .delete()
#     )
#     db.session.commit()
#     return ("", 204)

# # ---------------------------
# # Pin / Unpin
# # ---------------------------
# @announcement_routes.route("/<int:announcement_id>/pin", methods=["PUT"])
# def pin_announcement(announcement_id: int):
#     now_utc = datetime.now(timezone.utc)
#     user_id = int(current_user.get_id()) if hasattr(current_user, "get_id") else current_user.id
#     rows_updated = (
#         db.session.query(Announcement)
#         .filter_by(id=announcement_id)
#         .update({"pinned": True, "pinned_at": now_utc, "pinned_by": user_id})
#     )
#     if not rows_updated:
#         abort(404)
#     db.session.commit()
#     return ("", 204)

# @announcement_routes.route("/<int:announcement_id>/pin", methods=["DELETE"])
# def unpin_announcement(announcement_id: int):
#     rows_updated = (
#         db.session.query(Announcement)
#         .filter_by(id=announcement_id)
#         .update({"pinned": False, "pinned_at": None, "pinned_by": None})
#     )
#     if not rows_updated:
#         abort(404)
#     db.session.commit()
#     return ("", 204)

# # ---------------------------
# # Archive / Restore
# # ---------------------------
# @announcement_routes.route("/<int:announcement_id>", methods=["DELETE"])
# def archive_announcement(announcement_id: int):
#     now_utc = datetime.now(timezone.utc)
#     rows_updated = (
#         db.session.query(Announcement)
#         .filter_by(id=announcement_id)
#         .update({"archived_at": func.coalesce(Announcement.archived_at, now_utc)})
#     )
#     if not rows_updated:
#         abort(404)
#     db.session.commit()
#     return ("", 204)

# @announcement_routes.route("/<int:announcement_id>/restore", methods=["PUT"])
# def restore_announcement(announcement_id: int):
#     rows_updated = (
#         db.session.query(Announcement)
#         .filter_by(id=announcement_id)
#         .update({"archived_at": None})
#     )
#     if not rows_updated:
#         abort(404)
#     db.session.commit()
#     return ("", 204)

@announcement_routes.route("/", methods=["POST"])
def create_announcement():
    """
    create an announcement
    """

    data = request.get_json() or {}
    household_id = data.get("householdId")
    message = data.get("message")
    is_important = data.get("isImportant", False)

    if not household_id:
        abort(400, description="householdId is required")
    
    if not message:
        abort(400, description="message is required")

    user_id = int(current_user.get_id())

    announcement = Announcement(
        household_id=household_id,
        user_id=user_id,
        message=message,
        is_important=is_important
    )

    db.session.add(announcement)
    db.session.commit()

    return jsonify(announcement.to_dict()), 201

@announcement_routes.route("/<int:announcement_id>", methods=["DELETE"])
def delete_announcement(announcement_id: int):
    """
    delete announcement by id
    """
    announcement = db.session.query(Announcement).get(announcement_id)

    if not announcement:
        abort(404, description="Announcement not found")

    user_id = int(current_user.get_id())
    
    # Only creator can delete
    if announcement.user_id != user_id:
        abort(403, description="Only the creator can delete this announcement")

    db.session.delete(announcement)
    db.session.commit()

    return ("", 204)

@announcement_routes.route("/<int:announcement_id>", methods=["PUT"])
def update_announcement(announcement_id: int):
    """
    update announcement importance by id
    """
    data = request.get_json() or {}
    is_important = data.get("isImportant")

    if is_important is None:
        abort(400, description="isImportant is required")

    announcement = db.session.query(Announcement).get(announcement_id)

    if not announcement:
        abort(404, description="Announcement not found")
    
    user_id = int(current_user.get_id())
    
    # Only creator can update
    if announcement.user_id != user_id:
        abort(403, description="Only the creator can update this announcement")

    announcement.is_important = is_important
    db.session.commit()

    return jsonify(announcement.to_dict())

@announcement_routes.route("/<int:announcement_id>/seen", methods=["GET"])
def check_announcement_seen(announcement_id: int):
    """
    check if the current user has seen the announcement
    """
    announcement = db.session.query(Announcement).get(announcement_id)

    if not announcement:
        abort(404, description="Announcement not found")

    user_id = int(current_user.get_id())

    seen_record = (
        db.session.query(AnnouncementSeen)
        .filter_by(announcement_id=announcement_id, user_id=user_id)
        .first()
    )

    seen_by_current = seen_record is not None

    return jsonify({
        "announcementId": announcement_id,
        "seenByCurrent": seen_by_current,
        "seenAt": seen_record.seen_at.isoformat() if seen_record else None
    })

@announcement_routes.route("/<int:announcement_id>/seen", methods=["POST"])
def mark_announcement_seen(announcement_id: int):
    """
    mark the announcement as seen by the current user
    """
    announcement = db.session.query(Announcement).get(announcement_id)

    if not announcement:
        abort(404, description="Announcement not found")

    user_id = int(current_user.get_id())

    seen_record = (
        db.session.query(AnnouncementSeen)
        .filter_by(announcement_id=announcement_id, user_id=user_id)
        .first()
    )

    if not seen_record:
        seen_record = AnnouncementSeen(
            announcement_id=announcement_id,
            user_id=user_id
        )
        db.session.add(seen_record)
        db.session.commit()

    return jsonify({
        "announcementId": announcement_id,
        "seenByCurrent": True,
        "seenAt": seen_record.seen_at.isoformat()
    })

@announcement_routes.route("/<int:announcement_id>/seen", methods=["DELETE"])
def mark_announcement_unseen(announcement_id: int):
    """
    mark the announcement as unseen by the current user
    """
    announcement = db.session.query(Announcement).get(announcement_id)

    if not announcement:
        abort(404, description="Announcement not found")

    user_id = int(current_user.get_id())

    rows_deleted = (
        db.session.query(AnnouncementSeen)
        .filter_by(announcement_id=announcement_id, user_id=user_id)
        .delete()
    )

    db.session.commit()

    return ("", 204)