from flask import Blueprint, request, jsonify
from app.models import ShoppingCategory, ShoppingList
from app.extensions import db
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

shopping_category_routes = Blueprint("shopping_categories", __name__)

@shopping_category_routes.route("")
def get_list_categories():
    data = request.get_json()
    list_id = data.get("shoppingListId")

    if not list_id:
        return jsonify({"error": "shoppingListId is required"}), 400

    categories = ShoppingCategory.query.filter_by(shopping_list_id=list_id).all()

    return jsonify([category.to_dict() for category in categories]), 200


@shopping_category_routes.route("", methods=["POST"])
def create_shopping_category():
    data = request.get_json()
    name = data.get("name")
    list_id = data.get("shoppingListId")

    if not name or not list_id:
        return jsonify({"error": "Name and shoppingListId are required"}), 400

    duplicate = (
        ShoppingCategory.query
        .filter(
            ShoppingCategory.list_id == list_id,
            func.lower(func.trim(ShoppingCategory.name)) == func.lower(func.trim(name)),
        )
        .first()
    )
    
    if duplicate:
        return jsonify({"error": "Category already exists"}), 409

    category = ShoppingCategory(
        name=name,
        list_id=list_id
    )

    db.session.add(category)
    db.session.commit()

    return jsonify(category.to_dict()), 201 

@shopping_category_routes.route("/<int:id>", methods=["DELETE"])
def delete_shopping_category(id):
    category = ShoppingCategory.query.get(id)

    if not category:
        return jsonify({"error": "Shopping category not found"}), 404

    db.session.delete(category)
    db.session.commit()

    return jsonify({"message": "Shopping category deleted"}), 200


@shopping_category_routes.route("/<int:id>", methods=["PUT", "PATCH"])
def edit_category(id: int):
    # 404 if not found
    category = ShoppingCategory.query.get_or_404(id)

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()

    # basic validation
    if not name:
        return jsonify({"error": "Name is required"}), 400

    # no-op: same name
    if name == category.name:
        return jsonify(category.to_dict()), 200

    # optional: enforce uniqueness within the same list
    dup = (
        ShoppingCategory.query
        .filter(ShoppingCategory.list_id == category.list_id,
                ShoppingCategory.name == name,
                ShoppingCategory.id != id)
        .first()
    )
    if dup:
        return jsonify({"error": "A category with that name already exists"}), 409

    # update + return the new resource
    category.name = name
    db.session.commit()
    return jsonify(category.to_dict()), 200