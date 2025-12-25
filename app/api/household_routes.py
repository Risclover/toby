from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.extensions import db
from app.models import Household, TodoList, TodoListMember, Announcement, AnnouncementSeen
from sqlalchemy.orm import aliased
from sqlalchemy import outerjoin, or_, and_
import base64
from datetime import datetime
import json

household_routes = Blueprint('households', __name__)

def encode_cursor(payload: dict) -> str:
    raw = json.dumps(payload).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("utf-8")

def decode_cursor(cursor: str) -> dict:
    try:
        decoded_bytes = base64.urlsafe_b64decode(cursor.encode("utf-8"))
        return json.loads(decoded_bytes.decode("utf-8"))
    except Exception:
        raise ValueError("Invalid cursor")

@household_routes.route("/<int:id>")
def get_household(id):
    household = Household.query.get(id)

    return jsonify(household.to_dict())

@household_routes.route("/<int:household_id>/todo_lists", methods=["GET"])
@login_required
def get_household_todo_lists(household_id):
    household = Household.query.get(household_id)

    if not household:
        return jsonify({"error": "Household not found"}), 404

    lists = household.todo_lists

    return jsonify([t.to_dict() for t in lists]), 200

@household_routes.route("/<int:household_id>/todo_lists", methods=["POST"])
def create_household_todo_list(household_id):
    # 1) Household must exist
    household = Household.query.get(household_id)

    if not household:
        return jsonify({"error": "Household not found"}), 404

    # 2) Must be a member (tweak if you support multi-household users)
    if current_user.household_id != household_id:
        return jsonify({"error": "Forbidden"}), 403

    # 3) Validate payload
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "Title is required"}), 400

    all_members = bool(data.get("allMembers"))
    member_ids = data.get("memberIds") or []

    if not all_members:
        if not isinstance(member_ids, list) or len(member_ids) == 0:
            return jsonify({"error": "memberIds (non-empty) required when allMembers is false"}), 400
        valid_ids = {u.id for u in household.members or []}
        bad = [uid for uid in set(member_ids) if uid not in valid_ids]
        if bad:
            return jsonify({"error": "memberIds must belong to the household", "invalid": bad}), 400


    # 4) Create list + (optional) audience rows
    tl = TodoList(title=title, household_id=household_id, all_members=all_members)
    db.session.add(tl)
    db.session.flush()  # get tl.id now

    if not all_members:
        links = [TodoListMember(todo_list_id=tl.id, user_id=uid) for uid in set(member_ids)]
        db.session.add_all(links)

    db.session.commit()
    return jsonify(tl.to_dict(include_todos=False, include_members=True)), 201

@household_routes.route("/<int:id>/shopping")
def get_household_shopping_lists(id):
    household = Household.query.get(id)

    if not household:
        return jsonify({"error": "Household not found"}), 404

    return jsonify([sl.to_dict() for sl in household.shopping_lists]), 200

@household_routes.route("/<int:household_id>/shopping/<int:shopping_list_id>")
def get_household_shopping_list(household_id, shopping_list_id):
    household = Household.query.get(household_id)

    if not household:
        return jsonify({"error": "Household not found"}), 404

    shopping_list = next((sl for sl in household.shopping_lists if sl.id == shopping_list_id), None)
    
    if not shopping_list:
        return jsonify({"error": "Shopping list not found in this household"}), 404

    return jsonify(shopping_list.to_dict()), 200


# --------------------
# ANNOUNCEMENTS
# --------------------
@household_routes.route("/<int:household_id>/announcements")
def list_announcements(household_id: int):
    household = Household.query.get(household_id)
    if not household:
        return jsonify({"error": "Household not found"}), 404

    user_id = int(current_user.get_id())
    limit = int(request.args.get("limit", 10))
    page = int(request.args.get("page", 1))  # <-- page number

    offset = (page - 1) * limit

    seen_alias = aliased(AnnouncementSeen)

    q = (
        db.session.query(
            Announcement,
            seen_alias.seen_at.label("seen_at")
        )
        .outerjoin(
            seen_alias,
            (Announcement.id == seen_alias.announcement_id)
            & (seen_alias.user_id == user_id)
        )
        .filter(Announcement.household_id == household_id)
        .order_by(
            Announcement.created_at.desc(),
            Announcement.id.desc()
        )
        .offset(offset)
        .limit(limit)
    )

    rows = q.all()

    items = []
    for ann, seen_at in rows:
        data = ann.to_dict()
        data["seenByCurrent"] = seen_at is not None
        data["seenAt"] = seen_at.isoformat() if seen_at else None
        items.append(data)

    total_count = Announcement.query.filter_by(household_id=household_id).count()
    total_pages = (total_count + limit - 1) // limit

    return jsonify({
        "items": items,
        "page": page,
        "totalPages": total_pages,
        "hasNextPage": page < total_pages
    })