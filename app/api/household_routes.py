from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.extensions import db
from app.models import Household, Tasklist, TasklistMember, Announcement, AnnouncementSeen, Reminder, ReminderType, ReminderAssignment
from sqlalchemy.orm import aliased, joinedload
from sqlalchemy import outerjoin, or_, and_
import base64
from datetime import datetime, timedelta, timezone
from app.utils.parse_datetime import parse_datetime
from app.utils.timezone import utc_datetime_to_local
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

# --------------------
# HOUSEHOLD
# --------------------
@household_routes.route("/<int:id>")
def get_household(id):
    household = Household.query.get(id)
    if not household:
        return jsonify({"error": "Household not found"}), 404

    h_dict = household.to_dict()
    # convert createdAt to user tz
    h_dict["createdAt"] = utc_datetime_to_local(current_user, household.created_at).isoformat()
    return jsonify(h_dict)

# --------------------
# TASKLISTS
# --------------------
@household_routes.route("/<int:household_id>/tasklists", methods=["GET"])
@login_required
def get_household_tasklists(household_id):
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

    # convert createdAt in each tasklist to user tz if needed
    tasklists = []
    for t in lists:
        t_dict = t.to_dict()
        if hasattr(t, "created_at") and t.created_at:
            t_dict["createdAt"] = utc_datetime_to_local(current_user, t.created_at).isoformat()
        tasklists.append(t_dict)

    return jsonify(tasklists), 200

@household_routes.route("/<int:household_id>/tasklists", methods=["POST"])
@login_required
def create_household_tasklist(household_id):
    household = Household.query.get(household_id)
    if not household:
        return jsonify({"error": "Household not found"}), 404

    if current_user.household_id != household_id:
        return jsonify({"error": "Forbidden"}), 403

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

    tasklist = Tasklist(title=title, household_id=household_id, all_members=all_members)
    db.session.add(tasklist)
    db.session.flush()

    if not all_members:
        links = [TasklistMember(tasklist_id=tasklist.id, user_id=user_id) for user_id in set(member_ids)]
        db.session.add_all(links)

    db.session.commit()
    t_dict = tasklist.to_dict()
    if hasattr(tasklist, "created_at") and tasklist.created_at:
        t_dict["createdAt"] = utc_datetime_to_local(current_user, tasklist.created_at).isoformat()

    return jsonify(t_dict), 201

# --------------------
# SHOPPING LISTS
# --------------------
@household_routes.route("/<int:id>/shopping")
def get_household_shopping_lists(id):
    household = Household.query.get(id)
    if not household:
        return jsonify({"error": "Household not found"}), 404

    shopping_lists = []
    for sl in household.shopping_lists:
        sl_dict = sl.to_dict()
        if hasattr(sl, "created_at") and sl.created_at:
            sl_dict["createdAt"] = utc_datetime_to_local(current_user, sl.created_at).isoformat()
        shopping_lists.append(sl_dict)

    return jsonify(shopping_lists), 200

@household_routes.route("/<int:household_id>/shopping/<int:shopping_list_id>")
def get_household_shopping_list(household_id, shopping_list_id):
    household = Household.query.get(household_id)
    if not household:
        return jsonify({"error": "Household not found"}), 404

    shopping_list = next((sl for sl in household.shopping_lists if sl.id == shopping_list_id), None)
    if not shopping_list:
        return jsonify({"error": "Shopping list not found in this household"}), 404

    sl_dict = shopping_list.to_dict()
    if hasattr(shopping_list, "created_at") and shopping_list.created_at:
        sl_dict["createdAt"] = utc_datetime_to_local(current_user, shopping_list.created_at).isoformat()

    return jsonify(sl_dict)

# --------------------
# ANNOUNCEMENTS
# --------------------
@household_routes.route("/<int:household_id>/announcements")
def list_announcements(household_id: int):
    household = Household.query.get(household_id)
    if not household:
        return jsonify({"error": "Household not found"}), 404

    user_id = current_user.id
    limit = int(request.args.get("limit", 10))
    page = int(request.args.get("page", 1))
    search = (request.args.get("search") or "").strip()
    sort = request.args.get("sort", "")
    importance = request.args.get("important")
    creator_id = request.args.get("creator_id")
    time_filter = request.args.get("time")

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

    if search:
        q = q.filter(Announcement.message.ilike(f"%{search}%"))

    if importance == "true":
        q = q.filter(Announcement.is_important == True)

    if creator_id:
        q = q.filter(Announcement.user_id == int(creator_id))

    if time_filter and time_filter != "all":
        # 1. Get the current time in UTC
        now_utc = datetime.now(timezone.utc)
        
        # 2. Convert to User's Local Time to understand what "Today" means to them
        user_tz = get_user_timezone(current_user)
        now_user_local = now_utc.astimezone(user_tz)

        if time_filter == "today":
            # 3. Find "Midnight" (00:00) in the USER'S local time
            start_of_day_local = now_user_local.replace(hour=0, minute=0, second=0, microsecond=0)
            
            # 4. Convert that "User Midnight" back to UTC so the DB understands it
            start_time = start_of_day_local.astimezone(timezone.utc)
            
        elif time_filter == "7days":
            start_time = now_utc - timedelta(days=7)
        elif time_filter == "30days":
            start_time = now_utc - timedelta(days=30)
            
        q = q.filter(Announcement.created_at >= start_time)

    if sort == "Newest":
        q = q.order_by(Announcement.created_at.desc(), Announcement.id.desc())
    elif sort == "Oldest":
        q = q.order_by(Announcement.created_at.asc(), Announcement.id.asc())
    elif sort == "Important first":
        q = q.order_by(Announcement.is_important.desc(), Announcement.created_at.desc(), Announcement.id.desc())
    else:
        q = q.order_by(Announcement.created_at.desc(), Announcement.id.desc())

    total_count = q.count()
    total_pages = (total_count + limit - 1) // limit
    offset = (page - 1) * limit
    rows = q.offset(offset).limit(limit).all()

    items = []
    for ann, seen_at in rows:
        # Assumes ann.to_dict() returns createdAt in UTC
        data = ann.to_dict(user=current_user)
        
        # Consistent UTC handling for seenAt
        data["seenByCurrent"] = seen_at is not None
        if seen_at:
            if seen_at.tzinfo is None:
                seen_at = seen_at.replace(tzinfo=timezone.utc)
            data["seenAt"] = seen_at.isoformat()
        else:
            data["seenAt"] = None
            
        items.append(data)

    return jsonify({
        "items": items,
        "page": page,
        "totalPages": total_pages,
        "hasNextPage": page < total_pages,
        "hasPrevPage": page > 1,
        "totalCount": total_count,
    })

# --------------------
# REMINDERS
# --------------------
@household_routes.route("/<int:household_id>/reminders", methods=["GET"])
def get_household_reminders(household_id):
    household = Household.query.get(household_id)
    if not household:
        return jsonify({"error": "Household not found"}), 404

    now = datetime.utcnow()
    reminders = (
        Reminder.query
        .filter(
            Reminder.hodusehold_id == household_id,
            (Reminder.trigger_at == None) | (Reminder.trigger_at <= now),
            Reminder.seen == False
        )
        .order_by(Reminder.trigger_at.asc().nulls_last())
        .all()
    )

    reminders_list = []
    for r in reminders:
        r_dict = r.to_dict()
        if hasattr(r, "created_at") and r.created_at:
            r_dict["createdAt"] = utc_datetime_to_local(current_user, r.created_at).isoformat()
        if hasattr(r, "trigger_at") and r.trigger_at:
            r_dict["triggerAt"] = utc_datetime_to_local(current_user, r.trigger_at).isoformat()
        reminders_list.append(r_dict)

    return jsonify(reminders_list), 200

@household_routes.route("/<int:household_id>/reminders", methods=["POST"])
@login_required
def create_manual_reminder(household_id):
    household = Household.query.get(household_id)
    if not household:
        return jsonify({"error": "Household not found"}), 404

    if current_user not in household.members:
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json()
    assigned_user_ids = data.get("assignedToIds", [])

    reminder = Reminder(
        household_id=household_id,
        created_by_id=current_user.id,
        title=data.get("title"),
        body=data.get("reminderBody"),
        reminder_type=ReminderType.custom,
        is_automatic=False,
        trigger_at=parse_datetime(data.get("triggerAt")),
    )

    db.session.add(reminder)
    db.session.flush()  # <-- important, gets reminder.id

    for user_id in assigned_user_ids:
        assignment = ReminderAssignment(
            reminder_id=reminder.id,
            user_id=user_id,
        )
        db.session.add(assignment)

    db.session.commit()

    r_dict = reminder.to_dict()
    if hasattr(reminder, "created_at") and reminder.created_at:
        r_dict["createdAt"] = utc_datetime_to_local(current_user, reminder.created_at).isoformat()
    if hasattr(reminder, "trigger_at") and reminder.trigger_at:
        r_dict["triggerAt"] = utc_datetime_to_local(current_user, reminder.trigger_at).isoformat()

    return jsonify(r_dict), 201