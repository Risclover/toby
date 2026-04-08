from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.extensions import db
from app.models import Household, Tasklist, TasklistMember, Announcement, AnnouncementSeen, Reminder, ReminderType, ReminderAssignment, RepeatFrequency, User
from sqlalchemy.orm import aliased, joinedload
from sqlalchemy import outerjoin, or_, and_
import base64
from datetime import datetime, date, timedelta, timezone
from app.utils.parse_datetime import parse_datetime
from app.utils.timezone import utc_datetime_to_local
from app.utils.activity_service import ActivityService

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

    is_admin = current_user.id == household.admin_id

    lists = Tasklist.query.filter_by(
        household_id=household_id,
        is_archived=is_archived
    ).options(joinedload(Tasklist.archiver)).all()

    user_lists = []
    for tasklist in lists:
        # Admin sees everything
        if is_admin:
            user_lists.append(tasklist)
            continue

        if tasklist.creator_id == current_user.id:
            user_lists.append(tasklist)
            continue

        is_assigned = TasklistMember.query.filter_by(
            tasklist_id=tasklist.id,
            user_id=current_user.id
        ).first() is not None

        if tasklist.all_members or is_assigned:
            user_lists.append(tasklist)

    tasklists = []
    for t in user_lists:
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

    tasklist = Tasklist(title=title, household_id=household_id, all_members=all_members, creator_id=current_user.id)
    db.session.add(tasklist)
    db.session.flush()

    if not all_members:
        links = [TasklistMember(tasklist_id=tasklist.id, user_id=user_id) for user_id in set(member_ids)]
        db.session.add_all(links)

    ActivityService.record(
        household_id=household_id,
        actor_id=current_user.id,
        action="created",
        entity_type="tasklist",
        entity_id=tasklist.id,
        entity_label=tasklist.title,
        event_metadata={"listId": tasklist.id, "listTitle": tasklist.title},
    )
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
@login_required
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
@login_required
def get_household_reminders(household_id):
    household = Household.query.get(household_id)
    if not household:
        return jsonify({"error": "Household not found"}), 404

    today = date.today()  # ✅ date, not datetime

    # ✅ Join ReminderAssignment to filter by current user and seen status
    assignments = (
        ReminderAssignment.query
        .join(Reminder)
        .filter(
            ReminderAssignment.user_id == current_user.id,
            ReminderAssignment.seen.is_(False),
            Reminder.household_id == household_id,  # ✅ fixed typo
            Reminder.is_active.is_(True),
            or_(
                Reminder.trigger_date.is_(None),
                Reminder.trigger_date <= today,  # ✅ date vs date
            ),
        )
        .order_by(Reminder.trigger_date.asc().nulls_last())
        .all()
    )

    return jsonify([
        assignment.reminder.to_dict_for_user(assignment)
        for assignment in assignments
    ]), 200


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

    trigger_date = None
    raw_date = data.get("triggerDate")
    if raw_date:
        try:
            trigger_date = date.fromisoformat(raw_date)
        except ValueError:
            trigger_date = datetime.fromisoformat(raw_date).date()

    raw_repeat = data.get("repeat")
    repeat_frequency = RepeatFrequency(raw_repeat) if raw_repeat else None

    reminder = Reminder(
        household_id=household_id,
        created_by_id=current_user.id,
        message=data.get("message"),
        reminder_type=ReminderType.CUSTOM,
        repeat_frequency=repeat_frequency,
        is_automatic=False,
        trigger_date=trigger_date,
    )

    db.session.add(reminder)
    db.session.flush()

    for user_id in assigned_user_ids:
        db.session.add(ReminderAssignment(reminder_id=reminder.id, user_id=user_id))

    db.session.commit()

    return jsonify(reminder.to_dict()), 201

@household_routes.route("/<int:household_id>/reminders/preview", methods=["GET"])
@login_required
def get_household_reminders_preview(household_id):
    household = Household.query.get(household_id)
    if not household:
        return jsonify({"error": "Household not found"}), 404

    today = date.today()
    BACKFILL_LIMIT = 4

    # All active, triggered reminders assigned to current user
    all_assignments = (
        ReminderAssignment.query
        .join(Reminder)
        .filter(
            ReminderAssignment.user_id == current_user.id,
            Reminder.household_id == household_id,
            Reminder.is_active.is_(True),
            or_(
                Reminder.trigger_date.is_(None),
                Reminder.trigger_date <= today,
            ),
        )
        .order_by(Reminder.created_at.desc())
        .all()
    )

    print(f"Preview: user={current_user.id}, household={household_id}, assignments found={len(all_assignments)}")  # ← add this


    unseen = [a for a in all_assignments if not a.seen]
    seen = [a for a in all_assignments if a.seen]

    backfill_count = max(0, BACKFILL_LIMIT - len(unseen))
    visible = unseen + seen[:backfill_count]

    return jsonify([
        assignment.reminder.to_dict_for_user(assignment)
        for assignment in visible
    ]), 200

@household_routes.route("/<int:household_id>/members/<int:user_id>", methods=["DELETE"])
@login_required
def remove_household_member(household_id, user_id):
    household = Household.query.get(household_id)

    if not household:
        return jsonify({"error": "Household not found"}), 404

    if current_user.id != household.admin_id:
        return jsonify({"error": "Forbidden: Only household admin can remove members"}), 403

    if user_id == household.admin_id:
        return jsonify({"error": "Admin cannot remove themselves"}), 403

    user = User.query.get(user_id)
    if not user or user.household_id != household_id:
        return jsonify({"error": "User not found in this household"}), 404

    # TODO: call content cleanup helper here

    user.removed_from_household_id = household_id
    user.household_id = None
    db.session.commit()

    return jsonify({"message": f"User {user_id} removed from household {household_id}"}), 200

@household_routes.route("/<int:household_id>/admin", methods=["PATCH"])
@login_required
def transfer_admin_role(household_id):
    household = Household.query.get(household_id)

    if not household:
        return jsonify({"error": "Household not found"}), 404

    if current_user.id != household.admin_id:
        return jsonify({"error": "Forbidden: Only current admin can transfer admin role"}), 403
    
    data = request.get_json()
    new_admin_id = data.get("newAdminId")

    new_admin = User.query.get(new_admin_id)
    if not new_admin or new_admin.household_id != household_id:
        return jsonify({"error": "New admin user not found in this household"}), 404

    household.admin_id = new_admin_id
    db.session.commit()

    return jsonify({"message": f"Admin role transferred to user {new_admin_id} in household {household_id}"}), 200