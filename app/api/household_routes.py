from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.extensions import db
from app.models import Household, TodoList, TodoListMember, Announcement, AnnouncementSeen


household_routes = Blueprint('households', __name__)

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
@household_routes.route("/<int:household_id>/announcements", methods=["POST"])
def create_announcement(household_id: int):
    household = Household.query.get_or_404(household_id)

    payload = request.get_json(silent=True) or {}
    body_text = (payload.get("body") or "").strip()
    if not body_text:
        abort(400, description="Body is required")
    if len(body_text) > 500:
        abort(400, description="Body must be ≤ 500 characters")

    now_utc = datetime.now(timezone.utc)
    expires_at = compute_expires_at(
        created_at_utc=now_utc,
        ttl_mode=getattr(household, "announcements_ttl_mode", "rolling"),
        household_tzid=getattr(household, "tzid", "America/Los_Angeles"),
        ttl_hours=int(getattr(household, "announcements_ttl_hours", 24)),
    )

    author_id = int(current_user.get_id()) if hasattr(current_user, "get_id") else current_user.id
    announcement = Announcement(
        household_id=household.id,
        author_id=author_id,
        body=body_text,
        expires_at=expires_at,
    )

    db.session.add(announcement)
    db.session.commit()

    return jsonify(announcement.to_dict(current_user_id=author_id)), 201


@household_routes.route("/<int:household_id>/announcements")
def list_announcements(household_id: int):
    # Optional: ensure the current user is a member of this household
    Household.query.get_or_404(household_id)

    scope = (request.args.get("scope") or "active").lower()

    base_query = select(Announcement).where(Announcement.household_id == household_id)

    if scope == "active":
        user_id = int(current_user.get_id())  # ← important
        seen_exists = (
            select(AnnouncementSeen.id)
            .where(
                and_(
                    AnnouncementSeen.announcement_id == Announcement.id,
                    AnnouncementSeen.user_id == user_id,
                )
            )
            .exists()
        )
        query = base_query.where(
            Announcement.archived_at.is_(None),
            or_(
                Announcement.pinned.is_(True),
                func.now() < Announcement.expires_at,
                ~seen_exists,
            ),
        )
        # No pagination: just order and return all active
        query = query.order_by(
            Announcement.pinned.desc(),
            Announcement.pinned_at.desc().nulls_last(),
            Announcement.created_at.desc(),
            Announcement.id.desc(),
        )
        rows = db.session.execute(query).scalars().all()
        items = [row.to_dict(current_user_id=user_id) for row in rows]
        return jsonify({"items": items})

    elif scope == "history":
        # You can add pagination here later if you need it
        query = base_query.where(
            or_(
                Announcement.archived_at.is_not(None),
                Announcement.expires_at <= func.now(),
            )
        ).order_by(
            func.coalesce(
                Announcement.archived_at, Announcement.expires_at, Announcement.created_at
            ).desc(),
            Announcement.id.desc(),
        )
        rows = db.session.execute(query).scalars().all()
        items = [row.to_dict(current_user_id=int(current_user.get_id())) for row in rows]
        return jsonify({"items": items})

    else:
        abort(400, description="scope must be active|history")