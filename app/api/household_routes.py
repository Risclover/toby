from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.extensions import db
from app.models import Household, Tasklist, TasklistMember, Announcement, AnnouncementSeen, Reminder, ReminderType, ReminderAssignment, RepeatFrequency, User, ShoppingListMember, ShoppingList, FeaturedListSetting
from app.services.notification_triggers import (
    notify_tasklist_access_changed,
    notify_shopping_list_access_changed,
    notify_reminder_assigned,
    notify_member_removed,
    notify_user_removed,
    notify_admin_changed,
    notify_member_left,
    notify_admin_request,
    notify_admin_request_declined,
    retract_admin_request,
)
from sqlalchemy.orm import aliased, joinedload
from sqlalchemy import or_
import base64
from datetime import datetime, date, timedelta, timezone
from app.utils.parse_datetime import parse_datetime
from app.utils.timezone import utc_datetime_to_local, get_user_timezone
from app.services import ActivityService
from app.api.tasklist_routes import get_tasklist_audience_ids

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

# ---- HOUSEHOLD ----
@household_routes.route("/<int:id>")
def get_household(id):
    household = Household.query.get(id)
    if not household:
        return jsonify({"error": "Household not found"}), 404

    h_dict = household.to_dict()
    # convert createdAt to user tz
    h_dict["createdAt"] = utc_datetime_to_local(current_user, household.created_at).isoformat()
    return jsonify(h_dict)

# ---- TASKLISTS ----
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

    tasklists = []
    for t in lists:
        if not t.has_access(current_user):
            continue
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
    color = data.get("color", "")
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

    tasklist = Tasklist(title=title, color=color, household_id=household_id, all_members=all_members, creator_id=current_user.id)
    db.session.add(tasklist)
    db.session.flush()

    if not all_members:
        links = [TasklistMember(tasklist_id=tasklist.id, user_id=user_id) for user_id in set(member_ids)]
        db.session.add_all(links)
        db.session.flush()  # ensure member_links are visible before reading them

    ActivityService.record(
        household_id=household_id,
        actor_id=current_user.id,
        action="created",
        entity_type="tasklist",
        entity_id=tasklist.id,
        entity_label=tasklist.title,
        event_metadata={"listId": tasklist.id, "listTitle": tasklist.title},
        audience_ids=get_tasklist_audience_ids(tasklist),
    )

    # Everyone in a household-wide list already sees it in the activity feed;
    # only a chosen subset is "assigned". The creator is skipped as the actor.
    if not all_members:
        notify_tasklist_access_changed(tasklist, set(), set(member_ids), current_user)

    db.session.commit()
    t_dict = tasklist.to_dict()
    if hasattr(tasklist, "created_at") and tasklist.created_at:
        t_dict["createdAt"] = utc_datetime_to_local(current_user, tasklist.created_at).isoformat()

    return jsonify(t_dict), 201

# ---- SHOPPING LISTS ----
@household_routes.route("/<int:id>/shopping")
@login_required
def get_household_shopping_lists(id):
    household = Household.query.get(id)
    if not household:
        return jsonify({"error": "Household not found"}), 404

    if current_user.household_id != id:
        return jsonify({"error": "Forbidden: You are not a member of this household"}), 403

    shopping_lists = []
    for sl in household.shopping_lists:
        if not sl.has_access(current_user):
            continue
        sl_dict = sl.to_dict()
        if hasattr(sl, "created_at") and sl.created_at:
            sl_dict["createdAt"] = utc_datetime_to_local(current_user, sl.created_at).isoformat()
        shopping_lists.append(sl_dict)

    return jsonify(shopping_lists), 200

@household_routes.route("/<int:household_id>/shopping/<int:shopping_list_id>")
@login_required
def get_household_shopping_list(household_id, shopping_list_id):
    household = Household.query.get(household_id)
    if not household:
        return jsonify({"error": "Household not found"}), 404

    if current_user.household_id != household_id:
        return jsonify({"error": "Forbidden: You are not a member of this household"}), 403

    shopping_list = next((sl for sl in household.shopping_lists if sl.id == shopping_list_id), None)
    # A list the viewer can't see looks the same as one that doesn't exist.
    if not shopping_list or not shopping_list.has_access(current_user):
        return jsonify({"error": "Shopping list not found in this household"}), 404

    sl_dict = shopping_list.to_dict()
    if hasattr(shopping_list, "created_at") and shopping_list.created_at:
        sl_dict["createdAt"] = utc_datetime_to_local(current_user, shopping_list.created_at).isoformat()

    return jsonify(sl_dict)

@household_routes.route("/<int:household_id>/shopping-lists", methods=["POST"])
@login_required
def create_shopping_list(household_id):
    household = Household.query.get(household_id)
    if not household:
        return jsonify({ "error": "Household not found" }), 404
    
    if current_user.household_id != household_id:
        return jsonify({ "error": "Forbidden" }), 403
    
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    color = data.get("color")

    if not title:
        return jsonify({ "error": "Title is required" }), 400
    
    all_members = data.get("allMembers")
    if all_members is None:
        all_members = True
    elif not isinstance(all_members, bool):
        return jsonify({ "error": "allMembers must be a boolean" }), 400

    member_ids = data.get("memberIds") or []

    if not all_members:
        if not isinstance(member_ids, list) or len(member_ids) == 0:
            return jsonify({ "error": "memberIds (non-empty) required when allMembers is false" }), 400
        valid_ids = { u.id for u in household.members or []}
        bad = [user_id for user_id in set(member_ids) if user_id not in valid_ids]
        if bad:
            return jsonify({ "error": "memberIds must belong to the household", "invalid": bad }), 400
    
    shopping_list = ShoppingList(title=title, color=color, household_id=household_id, all_members=all_members, creator_id=current_user.id)
    db.session.add(shopping_list)
    db.session.flush()

    if not all_members:
        links = [ShoppingListMember(list_id=shopping_list.id, user_id=user_id) for user_id in set(member_ids)]
        db.session.add_all(links)
        db.session.flush()

    ActivityService.record(
        household_id=household_id,
        actor_id=current_user.id,
        action="created",
        entity_type="shopping_list",
        entity_id=shopping_list.id,
        entity_label=shopping_list.title,
        event_metadata={"listId": shopping_list.id, "listTitle": shopping_list.title},
        audience_ids=shopping_list.assignee_ids()
    )

    # Only a chosen subset is "assigned"; the creator is skipped as the actor.
    if not all_members:
        notify_shopping_list_access_changed(shopping_list, set(), set(member_ids), current_user)

    db.session.commit()

    return jsonify(shopping_list.to_dict()), 201


# ---- ANNOUNCEMENTS ----
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

# ---- REMINDERS ----
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
    assigned_user_ids = set(data.get("assignedToIds", []))

    household_member_ids = {u.id for u in household.members}
    invalid_ids = assigned_user_ids - household_member_ids
    if invalid_ids:
        return jsonify({
            "error": "assignedToIds must belong to the household",
            "invalid": sorted(invalid_ids),
        }), 400

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

    notify_reminder_assigned(reminder, assigned_user_ids, current_user)

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

def detach_from_household(user):
    """Everything that must happen to a user when they stop being a member,
    whether they left or were removed."""
    FeaturedListSetting.query.filter_by(user_id=user.id).update({"tasklist_id": None})

    # If they were the pending admin candidate, the offer dies with their membership.
    # Must run before household_id is cleared, since it filters on it.
    Household.query.filter_by(id=user.household_id, pending_admin_id=user.id).update(
        {"pending_admin_id": None}
    )

    # TODO: call content cleanup helper here
    user.household_id = None


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

    # Before household_id is cleared: the triggers read the household's members.
    notify_member_removed(household, user, current_user)
    notify_user_removed(household, user, current_user)

    user.removed_from_household_id = household_id
    detach_from_household(user)
    db.session.commit()

    return jsonify({"message": f"User {user_id} removed from household {household_id}"}), 200


@household_routes.route("/<int:household_id>/leave", methods=["POST"])
@login_required
def leave_household(household_id):
    household = Household.query.get(household_id)

    if not household:
        return jsonify({"error": "Household not found"}), 404

    if current_user.household_id != household_id:
        return jsonify({"error": "Forbidden: You are not a member of this household"}), 403

    if current_user.id == household.admin_id:
        return jsonify({"error": "Transfer the admin role before leaving the household"}), 400

    # Before household_id is cleared: the trigger reads the household's members.
    notify_member_left(household, current_user)

    detach_from_household(current_user)
    db.session.commit()

    return jsonify({"message": f"Left household {household_id}"}), 200

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

    if new_admin.id == household.admin_id:
        return jsonify({"error": "That user is already the admin"}), 400

    household.admin_id = new_admin.id
    notify_admin_changed(household, new_admin, current_user)
    db.session.commit()

    return jsonify({"message": f"Admin role transferred to user {new_admin_id} in household {household_id}"}), 200


# ---- ADMIN REQUEST ----

def _request_dict(household):
    if household.pending_admin_id is None:
        return None
    return {
        "id": household.id,
        "householdId": household.id,
        "fromUserId": household.admin_id,
        "toUserId": household.pending_admin_id,
    }


@household_routes.route("/<int:household_id>/admin-request", methods=["GET"])
@login_required
def get_admin_request(household_id):
    if current_user.household_id != household_id:
        return {"error": "Forbidden"}, 403
    household = Household.query.get_or_404(household_id)
    return {"request": _request_dict(household)}, 200


@household_routes.route("/<int:household_id>/admin-request", methods=["POST"])
@login_required
def create_admin_request(household_id):
    household = Household.query.get_or_404(household_id)
    if household.admin_id != current_user.id:
        return {"error": "Only the admin can hand over the role"}, 403

    new_admin_id = (request.get_json(silent=True) or {}).get("newAdminId")
    candidate = User.query.get(new_admin_id) if new_admin_id else None
    if candidate is None or candidate.household_id != household.id:
        return {"error": "That person isn't a member of this household"}, 400
    if candidate.id == current_user.id:
        return {"error": "You're already the admin"}, 400
    if household.pending_admin_id is not None:
        return {"error": "There's already a pending admin request"}, 409

    household.pending_admin_id = candidate.id
    notify_admin_request(household, candidate, current_user)
    db.session.commit()
    return {"request": _request_dict(household)}, 201


@household_routes.route("/<int:household_id>/admin-request/accept", methods=["POST"])
@login_required
def accept_admin_request(household_id):
    household = Household.query.get_or_404(household_id)
    if household.pending_admin_id is None:
        return {"error": "No pending admin request"}, 404
    if household.pending_admin_id != current_user.id:
        return {"error": "This request isn't for you"}, 403

    household.admin_id = current_user.id
    household.pending_admin_id = None
    notify_admin_changed(household, current_user, current_user)
    db.session.commit()
    return household.to_dict(current_user), 200


@household_routes.route("/<int:household_id>/admin-request/decline", methods=["POST"])
@login_required
def decline_admin_request(household_id):
    household = Household.query.get_or_404(household_id)
    if household.pending_admin_id is None:
        return {"error": "No pending admin request"}, 404
    if household.pending_admin_id != current_user.id:
        return {"error": "This request isn't for you"}, 403

    household.pending_admin_id = None
    notify_admin_request_declined(household, household.admin, current_user)
    db.session.commit()
    return {"request": None}, 200


@household_routes.route("/<int:household_id>/admin-request", methods=["DELETE"])
@login_required
def cancel_admin_request(household_id):
    household = Household.query.get_or_404(household_id)
    if household.admin_id != current_user.id:
        return {"error": "Only the admin can cancel the request"}, 403
    if household.pending_admin_id is None:
        return {"error": "No pending admin request"}, 404

    retract_admin_request(household, household.pending_admin_id)  # before clearing
    household.pending_admin_id = None
    db.session.commit()
    return {"request": None}, 200