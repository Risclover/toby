from flask import Blueprint, jsonify, request
from app.models import ShoppingList, ShoppingItem, User, Household
from app.models.shopping_list_member import ShoppingListMember
from app.extensions import db
from flask_login import current_user, login_required
from app.utils.activity_service import ActivityService

shopping_list_routes = Blueprint("shopping-lists", __name__)

def is_household_admin(household_id):
    household = Household.query.get(household_id)
    return household and current_user.id == household.admin_id

def get_shopping_list_audience_ids(shopping_list):
    """
    None = household-wide
    List = restricted to creator + assigned members
    """
    if shopping_list.all_members:
        return None 
    audience = {shopping_list.creator_id}
    for link in shopping_list.member_links:
        audience.add(link.user_id)
    return list(audience)

@shopping_list_routes.route("/<int:id>")
@login_required
def get_shopping_list(id):
    shopping_list = ShoppingList.query.get_or_404(id)
    return jsonify(shopping_list.to_dict()), 200

@shopping_list_routes.route("")
@login_required
def get_shopping_lists():
    household_id = request.args.get("householdId", type=int)
    if not household_id:
        return jsonify({"error": "householdId is required"}), 400

    shopping_lists = ShoppingList.query.filter_by(household_id=household_id).all()
    return jsonify([shopping_list.to_dict() for shopping_list in shopping_lists]), 200

@shopping_list_routes.route("/<int:id>/items", methods=["POST"])
@login_required
def add_item(id):
    data = request.get_json() or {}
    shopping_list = ShoppingList.query.get_or_404(id)

    item = ShoppingItem(
        title=data["title"],
        list_id=id,
        creator_id=current_user.id,
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
        event_metadata={"listId": shopping_list.id, "listTitle": shopping_list.title}
    )

    db.session.commit()

    return jsonify(item.to_dict()), 201

@shopping_list_routes.route("/<int:list_id>/items", methods=["DELETE"])
@login_required
def clear_list(list_id):
    shopping_list = ShoppingList.query.get_or_404(list_id)

    if current_user.id != shopping_list.creator_id and not is_household_admin(shopping_list.household_id):
        return jsonify({"error": "Forbidden"}), 403
    
    ShoppingItem.query.filter_by(list_id=list_id).delete()
    db.session.commit()

    return jsonify({"message": f"All items deleted from list {list_id}"}), 200

@shopping_list_routes.route("/<int:id>", methods=["DELETE"])
@login_required
def delete_list(id):
    shopping_list = ShoppingList.query.get_or_404(id)

    if current_user.id != shopping_list.creator_id and not is_household_admin(shopping_list.household_id):
        return jsonify({"error": "Forbidden"}), 403
    
    ActivityService.record(
        household_id=shopping_list.household_id,
        actor_id=current_user.id,
        action="deleted",
        entity_type="shopping_list",
        entity_id=shopping_list.id,
        entity_label=shopping_list.title
    )

    db.session.delete(shopping_list)
    db.session.commit()

    return jsonify({"message": f"Shopping list {id} deleted"}), 200

@shopping_list_routes.route("/<int:id>", methods=["PATCH"])
@login_required
def edit_shopping_list(id):
    shopping_list = ShoppingList.query.get_or_404(id)

    if current_user.id != shopping_list.creator_id and not is_household_admin(shopping_list.household_id):
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json()
    old_title = shopping_list.title
    title = data.get("title", shopping_list.title)
    shopping_list.title = title

    ActivityService.record(
        household_id=shopping_list.household_id,
        actor_id=current_user.id,
        action="renamed",
        entity_type="shopping_list",
        entity_id=shopping_list.id,
        entity_label=title,
        event_metadata={"oldTitle": old_title}
    )

    db.session.commit()
    
    return jsonify(shopping_list.to_dict()), 200

@shopping_list_routes.route("/<int:id>/duplicate", methods=["POST"])
@login_required
def duplicate_list(id):
    try:
        original_list = ShoppingList.query.get_or_404(id)

        if not is_household_admin(original_list.household_id):
            if current_user.id not in original_list.assignee_ids():
                return jsonify({"error": "Access denied"}), 403

        new_list = original_list.duplicate()

        ActivityService.record(
            household_id=new_list.household_id,
            actor_id=current_user.id,
            action="created",
            entity_type="shopping_list",
            entity_id=new_list.id,
            entity_label=new_list.title,
            event_metadata={"duplicatedFrom": original_list.title}
        )
        
        db.session.commit()
        return jsonify(new_list.to_dict()), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to duplicate list"}), 500

@shopping_list_routes.route("/<int:id>/archive", methods=["PATCH"])
@login_required
def archive_list(id):
    shopping_list = ShoppingList.query.get_or_404(id)

    if current_user.id != shopping_list.creator_id and not is_household_admin(shopping_list.household_id):
        return jsonify({"error": "Forbidden"}), 403
    
    shopping_list.is_archived = True
    shopping_list.archived_by = current_user.id

    ActivityService.record(
        household_id=shopping_list.household_id,
        actor_id=current_user.id,
        action="archived",
        entity_type="shopping_list",
        entity_id=shopping_list.id,
        entity_label=shopping_list.title
    )

    db.session.commit()
    return jsonify(shopping_list.to_dict()), 200

@shopping_list_routes.route("/<int:id>/unarchive", methods=["PATCH"])
@login_required
def unarchive_list(id):
    shopping_list = ShoppingList.query.get_or_404(id)

    if current_user.id != shopping_list.creator_id and not is_household_admin(shopping_list.household_id):
        return jsonify({"error": "Forbidden"}), 403
    
    shopping_list.is_archived = False
    shopping_list.archived_by = None

    ActivityService.record(
        household_id=shopping_list.household_id,
        actor_id=current_user.id,
        action="unarchived",
        entity_type="shopping_list",
        entity_id=shopping_list.id,
        entity_label=shopping_list.title
    )

    db.session.commit()
    return jsonify(shopping_list.to_dict()), 200

@shopping_list_routes.route("/<int:id>/check-all", methods=["PATCH"])
@login_required
def check_all_items(id):
    shopping_list = ShoppingList.query.get_or_404(id)

    if current_user.id != shopping_list.creator_id and not is_household_admin(shopping_list.household_id):
        return jsonify({"error": "Forbidden"}), 403
    
    for item in shopping_list.items:
        item.is_checked = True
    
    db.session.commit()
    return jsonify(shopping_list.to_dict()), 200

@shopping_list_routes.route("/<int:id>/uncheck-all", methods=["PATCH"])
@login_required
def uncheck_all_items(id):
    shopping_list = ShoppingList.query.get_or_404(id)

    if current_user.id != shopping_list.creator_id and not is_household_admin(shopping_list.household_id):
        return jsonify({"error": "Forbidden"}), 403
    
    for item in shopping_list.items:
        item.is_checked = False
    
    db.session.commit()
    return jsonify(shopping_list.to_dict()), 200

@shopping_list_routes.route("/<int:id>/assigned-members", methods=["PATCH"])
@login_required
def manage_assigned_members(id):
    shopping_list = ShoppingList.query.get_or_404(id)

    if current_user.id != shopping_list.creator_id and not is_household_admin(shopping_list.household_id):
        return jsonify({"error": "Forbidden"}), 403
    
    data = request.get_json() or {}
    new_member_ids = set(data.get("members", []))

    household_member_ids = {u.id for u in shopping_list.household.members}

    invalid_ids = new_member_ids - household_member_ids

    if invalid_ids:
        return jsonify({"error": "Members must belong to the household", "invalid": list(invalid_ids)}), 400
    
    for link in shopping_list.member_links[:]:
        db.session.delete(link)

    if new_member_ids == household_member_ids:
        shopping_list.all_members = True
    else:
        shopping_list.all_members = False
        for user_id in new_member_ids:
            db.session.add(ShoppingListMember(list_id=shopping_list.id, user_id=user_id))
    
    db.session.commit()
    return jsonify(shopping_list.to_dict()), 200