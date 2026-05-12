# app/routes/shopping_item_routes.py
from flask import Blueprint, request, jsonify
from flask_login import current_user, login_required
from app.models import ShoppingItem, ShoppingCategory
from app.extensions import db
from app.utils.activity_service import ActivityService

shopping_item_routes = Blueprint("shopping-items", __name__)


@shopping_item_routes.route("/<int:id>")
@login_required
def get_shopping_item(id):
    item = ShoppingItem.query.get_or_404(id)
    return jsonify(item.to_dict()), 200


@shopping_item_routes.route("/<int:id>", methods=["PATCH"])
@login_required
def update_shopping_item(id):
    item = ShoppingItem.query.get_or_404(id)
    data = request.get_json() or {}

    if "name" in data:
        name = data["name"]
        if not name or not isinstance(name, str) or not name.strip():
            return jsonify({"error": "Name must be a non-empty string"}), 400
        item.name = name.strip()

    if "quantity" in data:
        quantity = data["quantity"]
        if quantity is not None and (not isinstance(quantity, int) or quantity < 1):
            return jsonify({"error": "Quantity must be a positive integer or null"}), 400
        item.quantity = quantity

    if "unit" in data:
        item.unit = data["unit"] or None

    if "notes" in data:
        notes = data["notes"]
        if notes is not None and not isinstance(notes, str):
            return jsonify({"error": "Notes must be a string"}), 400
        item.notes = notes.strip() if notes else None

    if "categoryId" in data:
        category_id = data["categoryId"]
        if category_id is None:
            item.category_id = None
        else:
            category = ShoppingCategory.query.filter_by(id=category_id, list_id=item.list_id).first()
            if not category:
                return jsonify({"error": "Category not found in this shopping list"}), 404
            item.category_id = category.id

    db.session.commit()
    return jsonify(item.to_dict()), 200


@shopping_item_routes.route("/<int:id>", methods=["DELETE"])
@login_required
def delete_shopping_item(id):
    item = ShoppingItem.query.get_or_404(id)

    ActivityService.record(
        household_id=item.shopping_list.household_id,
        actor_id=current_user.id,
        action="deleted",
        entity_type="shopping_item",
        entity_id=item.id,
        entity_label=item.name,
        event_metadata={"listId": item.list_id, "listName": item.shopping_list.name},
    )

    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Shopping item deleted"}), 200


@shopping_item_routes.route("/<int:id>/toggle", methods=["PATCH"])
@login_required
def toggle_shopping_item(id):
    item = ShoppingItem.query.get_or_404(id)

    item.is_checked = not item.is_checked
    item.completed_by_id = current_user.id if item.is_checked else None

    ActivityService.record(
        household_id=item.shopping_list.household_id,
        actor_id=current_user.id,
        action="purchased" if item.is_checked else "unpurchased",
        entity_type="shopping_item",
        entity_id=item.id,
        entity_label=item.name,
        event_metadata={"listId": item.list_id, "listName": item.shopping_list.name},
    )

    db.session.commit()
    return jsonify(item.to_dict()), 200