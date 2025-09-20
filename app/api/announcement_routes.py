from flask import Blueprint, jsonify, request, abort
from flask_login import login_required, current_user
from datetime import datetime
from app.models import Announcement
from app.extensions import db

announcement_routes = Blueprint("announcements", __name__)

def _parse_iso(dt_str):
    if not dt_str:
        return None
    try:
        return datetime.fromisoformat(str(dt_str).replace("Z", "+00:00"))
    except ValueError:
        abort(400, description="Invalid datetime format; expected ISO 8601")

def _to_bool(v):
    if isinstance(v, bool): return v
    if v is None: return False
    if isinstance(v, (int, float)): return bool(v)
    s = str(v).strip().lower()
    return s in ("1", "true", "t", "yes", "y")

def _get_announcement_or_404(id: int):
    a = Announcement.query.get_or_404(id)
    # TODO: membership/role check here if you want
    return a

@announcement_routes.route("/", methods=["GET"])
def list_announcements():
    hid = request.args.get("householdId", type=int)
    if not hid:
        abort(400, description="householdId is required")
    anns = Announcement.query.filter_by(household_id=hid).all()
    return jsonify([a.to_dict() for a in anns]), 200

@announcement_routes.route("/", methods=["POST"])
def create_announcement():
    data = request.get_json(silent=True) or {}
    text = data.get("text")
    household_id = data.get("householdId")
    if not text or not household_id:
        abort(400, description="text and householdId are required")

    announcement = Announcement(
        text=text,
        user_id=current_user.id,  # don't trust client
        household_id=household_id,
        is_pinned=_to_bool(data.get("isPinned", False)),
        published_at=_parse_iso(data.get("publishedAt")),
        expires_at=_parse_iso(data.get("expiresAt")),
    )
    db.session.add(announcement)
    db.session.commit()
    return jsonify(announcement.to_dict()), 201

@announcement_routes.route("/<int:id>", methods=["GET"])
def get_announcement(id):
    a = _get_announcement_or_404(id)
    return jsonify(a.to_dict())

@announcement_routes.route("/<int:id>", methods=["PATCH"])
def patch_announcement(id):
    a = _get_announcement_or_404(id)
    data = request.get_json(silent=True) or {}

    if "text" in data:
        a.text = data["text"]
    if "isPinned" in data:
        a.is_pinned = _to_bool(data["isPinned"])
    if "publishedAt" in data:
        a.published_at = _parse_iso(data["publishedAt"])
    if "expiresAt" in data:
        a.expires_at = _parse_iso(data["expiresAt"])

    db.session.commit()
    return jsonify(a.to_dict())

@announcement_routes.route("/<int:id>", methods=["DELETE"])
def delete_announcement(id):
    a = _get_announcement_or_404(id)
    db.session.delete(a)
    db.session.commit()
    return "", 204
