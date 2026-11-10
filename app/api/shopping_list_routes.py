from flask import Blueprint, abort, jsonify, make_response, request
from app.models import ShoppingList, ShoppingItem
from app.models.shopping_list_member import ShoppingListMember
from app.extensions import db
from flask_login import current_user, login_required
from app.services import ActivityService
from app.services.notification_triggers import (
    shopping_list_access_ids,
    notify_shopping_list_access_changed,
    notify_shopping_list_self_unassigned,
    notify_shopping_list_changed,
    notify_shopping_list_deleted,
)
from datetime import datetime

shopping_list_routes = Blueprint("shopping-lists", __name__)


# ---- HELPERS ----

def _fail(status, message):
    abort(make_response(jsonify({"error": message}), status))


def get_accessible_list(id):
    """The list, or 404 if it doesn't exist or the user can't see it."""
    shopping_list = ShoppingList.query.get_or_404(id)
    if not shopping_list.has_access(current_user):
        _fail(404, "Not found")
    return shopping_list


def get_managed_list(id):
    """The list, or 404 if it can't be seen, or 403 if it can be seen but not managed."""
    shopping_list = get_accessible_list(id)
    if not shopping_list.can_manage(current_user):
        _fail(403, "Forbidden")
    return shopping_list


# ---- READING ----

@shopping_list_routes.route("/<int:id>")
@login_required
def get_shopping_list(id):
    shopping_list = get_accessible_list(id)
    return jsonify(shopping_list.to_dict()), 200

@shopping_list_routes.route("")
@login_required
def get_shopping_lists():
    household_id = request.args.get("householdId", type=int)
    is_archived = request.args.get("is_archived", "false").lower() == "true"

    if not household_id:
        return jsonify({"error": "householdId is required"}), 400
    if current_user.household_id != household_id:
        return jsonify({"error": "Forbidden"}), 403

    shopping_lists = ShoppingList.query.filter_by(household_id=household_id, is_archived=is_archived).all()
    visible = [sl for sl in shopping_lists if sl.has_access(current_user)]
    return jsonify([shopping_list.to_dict() for shopping_list in visible]), 200


# ---- ITEMS ----

@shopping_list_routes.route("/<int:id>/items", methods=["POST"])
@login_required
def add_item(id):
    shopping_list = get_accessible_list(id)
    data = request.get_json() or {}

    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400

    item = ShoppingItem(
        name=name,
        list_id=id,
        creator_id=current_user.id,
        quantity=data.get("quantity", 0),
        unit=data.get("unit", ""),
        category_id=data.get("categoryId", None)
    )

    db.session.add(item)
    db.session.flush()

    ActivityService.record(
        household_id=shopping_list.household_id,
        actor_id=current_user.id,
        action="created",
        entity_type="shopping_item",
        entity_id=item.id,
        entity_label=item.name,
        event_metadata={"listId": shopping_list.id, "listTitle": shopping_list.title},
        audience_ids=shopping_list.assignee_ids(),
        batch_key=f"shopping-item-created-{shopping_list.id}",
    )

    db.session.commit()

    return jsonify(item.to_dict()), 201

@shopping_list_routes.route("/<int:list_id>/items", methods=["DELETE"])
@login_required
def clear_list(list_id):
    shopping_list = get_managed_list(list_id)

    ShoppingItem.query.filter_by(list_id=shopping_list.id).delete()
    db.session.commit()

    return jsonify({"message": f"All items deleted from list {list_id}"}), 200

@shopping_list_routes.route("/<int:id>/check-all", methods=["PATCH"])
@login_required
def check_all_items(id):
    shopping_list = get_managed_list(id)

    for item in shopping_list.items:
        item.is_checked = True

    db.session.commit()
    return jsonify(shopping_list.to_dict()), 200

@shopping_list_routes.route("/<int:id>/uncheck-all", methods=["PATCH"])
@login_required
def uncheck_all_items(id):
    shopping_list = get_managed_list(id)

    for item in shopping_list.items:
        item.is_checked = False

    db.session.commit()
    return jsonify(shopping_list.to_dict()), 200


# ---- LIST LIFECYCLE ----

@shopping_list_routes.route("/<int:id>", methods=["DELETE"])
@login_required
def delete_list(id):
    shopping_list = get_managed_list(id)

    ActivityService.record(
        household_id=shopping_list.household_id,
        actor_id=current_user.id,
        action="deleted",
        entity_type="shopping_list",
        entity_id=shopping_list.id,
        entity_label=shopping_list.title,
        audience_ids=shopping_list.assignee_ids(),
    )

    notify_shopping_list_deleted(shopping_list, current_user)

    db.session.delete(shopping_list)
    db.session.commit()

    return jsonify({"message": f"Shopping list {id} deleted"}), 200

@shopping_list_routes.route("/<int:id>", methods=["PATCH"])
@login_required
def edit_shopping_list(id):
    shopping_list = get_managed_list(id)

    data = request.get_json() or {}

    old_title = shopping_list.title
    before_ids = shopping_list_access_ids(shopping_list)
    after_ids = None   # stays None unless the members change
    title = data.get("title", shopping_list.title)
    shopping_list.title = title

    if "color" in data:
        shopping_list.color = data["color"]

    if "memberIds" in data:
        new_member_ids = set(data["memberIds"])
        household_member_ids = {u.id for u in shopping_list.household.members}
        invalid_ids = new_member_ids - household_member_ids
        if invalid_ids:
            return jsonify({"error": "Members must belong to the household", "invalid": list(invalid_ids)}), 400

        for link in shopping_list.member_links[:]:
            db.session.delete(link)

        if new_member_ids == household_member_ids:
            shopping_list.all_members = True
            after_ids = household_member_ids | {shopping_list.creator_id}
        else:
            shopping_list.all_members = False
            for user_id in new_member_ids:
                db.session.add(ShoppingListMember(list_id=shopping_list.id, user_id=user_id))
            after_ids = new_member_ids | {shopping_list.creator_id}

    if title != old_title:
        ActivityService.record(
            household_id=shopping_list.household_id,
            actor_id=current_user.id,
            action="renamed",
            entity_type="shopping_list",
            entity_id=shopping_list.id,
            entity_label=title,
            event_metadata={"oldTitle": old_title},
            audience_ids=shopping_list.assignee_ids(),
        )

        kept_ids = before_ids if after_ids is None else before_ids & after_ids
        notify_shopping_list_changed(shopping_list, kept_ids, current_user)

    if after_ids is not None:
        notify_shopping_list_access_changed(shopping_list, before_ids, after_ids, current_user)

    db.session.commit()
    return jsonify(shopping_list.to_dict()), 200

@shopping_list_routes.route("/<int:id>/duplicate", methods=["POST"])
@login_required
def duplicate_list(id):
    # Looked up outside the try: its 404 must not be swallowed into a 500.
    original_list = get_accessible_list(id)

    try:
        new_list = original_list.duplicate(creator_id=current_user.id)

        ActivityService.record(
            household_id=new_list.household_id,
            actor_id=current_user.id,
            action="created",
            entity_type="shopping_list",
            entity_id=new_list.id,
            entity_label=new_list.title,
            event_metadata={"duplicatedFrom": original_list.title},
            audience_ids=new_list.assignee_ids(),
        )

        # duplicate() copies the member links by id, so read them from the original.
        if not new_list.all_members:
            copied_ids = {link.user_id for link in original_list.member_links}
            notify_shopping_list_access_changed(new_list, set(), copied_ids, current_user)

        db.session.commit()
        return jsonify(new_list.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to duplicate list", "detail": str(e)}), 500

@shopping_list_routes.route("/<int:id>/archive", methods=["PATCH"])
@login_required
def archive_list(id):
    shopping_list = get_managed_list(id)

    shopping_list.is_archived = True
    shopping_list.archived_by = current_user.id
    shopping_list.archived_date = datetime.utcnow()

    ActivityService.record(
        household_id=shopping_list.household_id,
        actor_id=current_user.id,
        action="archived",
        entity_type="shopping_list",
        entity_id=shopping_list.id,
        entity_label=shopping_list.title,
        audience_ids=shopping_list.assignee_ids(),
    )

    db.session.commit()
    return jsonify(shopping_list.to_dict()), 200

@shopping_list_routes.route("/<int:id>/unarchive", methods=["PATCH"])
@login_required
def unarchive_list(id):
    shopping_list = get_managed_list(id)

    shopping_list.is_archived = False
    shopping_list.archived_by = None

    ActivityService.record(
        household_id=shopping_list.household_id,
        actor_id=current_user.id,
        action="unarchived",
        entity_type="shopping_list",
        entity_id=shopping_list.id,
        entity_label=shopping_list.title,
        audience_ids=shopping_list.assignee_ids(),
    )

    db.session.commit()
    return jsonify(shopping_list.to_dict()), 200


# ---- MEMBERS ----

@shopping_list_routes.route("/<int:id>/assigned-members", methods=["PATCH"])
@login_required
def manage_assigned_members(id):
    shopping_list = get_managed_list(id)

    data = request.get_json() or {}
    new_member_ids = set(data.get("members", []))

    household_member_ids = {u.id for u in shopping_list.household.members}

    invalid_ids = new_member_ids - household_member_ids

    if invalid_ids:
        return jsonify({"error": "Members must belong to the household", "invalid": list(invalid_ids)}), 400

    before_ids = shopping_list_access_ids(shopping_list)

    for link in shopping_list.member_links[:]:
        db.session.delete(link)

    if new_member_ids == household_member_ids:
        shopping_list.all_members = True
        after_ids = household_member_ids | {shopping_list.creator_id}
    else:
        shopping_list.all_members = False
        for user_id in new_member_ids:
            db.session.add(ShoppingListMember(list_id=shopping_list.id, user_id=user_id))
        after_ids = new_member_ids | {shopping_list.creator_id}

    notify_shopping_list_access_changed(shopping_list, before_ids, after_ids, current_user)

    db.session.commit()
    return jsonify(shopping_list.to_dict()), 200

@shopping_list_routes.route("/<int:id>/leave", methods=["POST"])
@login_required
def leave_list(id):
    """A member takes themselves off a restricted list. The creator is told."""
    shopping_list = ShoppingList.query.get_or_404(id)

    if shopping_list.all_members:
        return jsonify({"error": "Everyone in the household has access to this list"}), 400
    if current_user.id == shopping_list.creator_id:
        return jsonify({"error": "You can't leave a list you created"}), 400

    link = ShoppingListMember.query.filter_by(
        list_id=shopping_list.id, user_id=current_user.id
    ).first()
    if link is None:
        return jsonify({"error": "You are not a member of this list"}), 404

    db.session.delete(link)
    notify_shopping_list_self_unassigned(shopping_list, current_user)

    db.session.commit()
    return jsonify({"message": f"Left list {id}"}), 200


# ---- OPTIONS ----

@shopping_list_routes.route("/<int:id>/options", methods=["PATCH"])
@login_required
def update_list_options(id):
    shopping_list = get_managed_list(id)

    data = request.get_json() or {}

    if "defaultSort" in data:
        if data["defaultSort"] not in ("created", "alpha"):
            return jsonify({"error": "Invalid sort value"}), 400
        shopping_list.default_sort = data["defaultSort"]

    if "groupByCategory" in data:
        shopping_list.group_by_category = bool(data["groupByCategory"])

    db.session.commit()
    return jsonify(shopping_list.to_dict()), 200