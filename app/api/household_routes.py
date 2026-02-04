from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.extensions import db
from app.models import Household, Tasklist, TasklistMember, Announcement, AnnouncementSeen
from sqlalchemy.orm import aliased, joinedload
from sqlalchemy import outerjoin, or_, and_
import base64
from datetime import datetime, timedelta
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

@household_routes.route("/<int:household_id>/tasklists", methods=["GET"])
@login_required
def get_household_tasklists(household_id):
    """
    Fetch tasklists for a specific household, filtered by archived status.
    Ensures the current user actually belongs to the household.
    """
    is_archived = request.args.get("is_archived") == "true"

    household = Household.query.get(household_id)
    if not household:
        return jsonify({"error": "Household not found"}), 404

    if current_user.household_id != household_id:
        return jsonify({"error": "Forbidden: You are not a member of this household"}), 403

    lists = Tasklist.query.filter_by(
        household_id=household_id, 
        is_archived=is_archived
    ).options(joinedload(Tasklist.archiver)).all()

    return jsonify([t.to_dict() for t in lists]), 200

@household_routes.route("/<int:household_id>/tasklists", methods=["POST"])
def create_household_tasklist(household_id):
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

    all_members = data.get("allMembers")

    if all_members is None:
        all_members = True
    elif not isinstance(all_members, bool):
        return jsonify({"error": "allMembers must be a boolean"}), 400

    member_ids = data.get("memberIds") or []

    if not all_members:
        if not isinstance(member_ids, list) or len(member_ids) == 0:
            return jsonify({"error": "memberIds (non-empty) required when allMembers is false"}), 400
        valid_ids = {u.id for u in household.members or []}
        bad = [user_id for user_id in set(member_ids) if user_id not in valid_ids]
        if bad:
            return jsonify({"error": "memberIds must belong to the household", "invalid": bad}), 400


    # 4) Create list + (optional) audience rows
    tasklist = Tasklist(title=title, household_id=household_id, all_members=all_members)
    db.session.add(tasklist)
    db.session.flush()  # get tl.id now

    if not all_members:
        links = [TasklistMember(tasklist_id=tasklist.id, user_id=user_id) for user_id in set(member_ids)]
        db.session.add_all(links)

    db.session.commit()
    return jsonify(tasklist.to_dict(include_tasks=False, include_members=True)), 201

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
    page = int(request.args.get("page", 1))
    search = (request.args.get("search") or "").strip()
    sort = request.args.get("sort", "")
    importance = request.args.get("important")  # "true" or None
    creator_id = request.args.get("creator_id")
    time_filter = request.args.get("time")  # "today", "7days", "30days", "all"

    seen_alias = aliased(AnnouncementSeen)

    q = (
        db.session.query(
            Announcement,
            seen_alias.seen_at.label("seen_at")
        )
        .outerjoin(
            seen_alias,
            (Announcement.id == seen_alias.announcement_id) & (seen_alias.user_id == user_id)
        )
        .filter(Announcement.household_id == household_id)
    )

    # Search filter
    if search:
        q = q.filter(Announcement.message.ilike(f"%{search}%"))

    # Importance filter
    if importance == "true":
        q = q.filter(Announcement.is_important == True)

    # Creator filter
    if creator_id:
        q = q.filter(Announcement.user_id == int(creator_id))

    # Time filter
    if time_filter and time_filter != "all":
        now = datetime.utcnow()
        if time_filter == "today":
            start_time = datetime(now.year, now.month, now.day)
        elif time_filter == "7days":
            start_time = now - timedelta(days=7)
        elif time_filter == "30days":
            start_time = now - timedelta(days=30)
        q = q.filter(Announcement.created_at >= start_time)

    # Sort
    if sort == "Newest":
        q = q.order_by(Announcement.created_at.desc(), Announcement.id.desc())
    elif sort == "Oldest":
        q = q.order_by(Announcement.created_at.asc(), Announcement.id.asc())
    elif sort == "Important first":
        q = q.order_by(Announcement.is_important.desc(), Announcement.created_at.desc(), Announcement.id.desc())
    else:  # default newest
        q = q.order_by(Announcement.created_at.desc(), Announcement.id.desc())

    # Pagination
    total_count = q.count()
    total_pages = (total_count + limit - 1) // limit
    offset = (page - 1) * limit
    rows = q.offset(offset).limit(limit).all()

    items = []
    for ann, seen_at in rows:
        data = ann.to_dict()
        data["seenByCurrent"] = seen_at is not None
        data["seenAt"] = seen_at.isoformat() if seen_at else None
        items.append(data)

    return jsonify({
        "items": items,
        "page": page,
        "totalPages": total_pages,
        "hasNextPage": page < total_pages,
        "hasPrevPage": page > 1,
        "totalCount": total_count,
    })


@household_routes.route("/<int:id>/reminders", methods=["GET"])
def get_household_reminders(id):
    """
    Retrieve household reminders
    """
    household = Household.query.get(id)

    if not household:
        return jsonify({"error": "Household not found"}), 404

    reminders = [reminder.to_dict() for reminder in household.reminders]

    return jsonify(reminders), 200