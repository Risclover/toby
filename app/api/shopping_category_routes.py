# app/routes/shopping_category_routes.py
from flask import Blueprint, request, jsonify
from flask_login import current_user, login_required
from app.models import ShoppingCategory, ShoppingList
from app.extensions import db
from sqlalchemy import func

shopping_category_routes = Blueprint("shopping-categories", __name__)


@shopping_category_routes.route("", methods=["GET"])
@login_required
def get_list_categories():
    list_id = request.args.get("listId", type=int)

    if not list_id:
        return jsonify({"error": "listId is required"}), 400

    categories = ShoppingCategory.query.filter_by(list_id=list_id).all()
    return jsonify([category.to_dict() for category in categories]), 200


@shopping_category_routes.route("", methods=["POST"])
@login_required
def create_shopping_category():
    data = request.get_json() or {}
    name = data.get("name")
    list_id = data.get("listId")

    if not name or not list_id:
        return jsonify({"error": "Name and listId are required"}), 400

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

    category = ShoppingCategory(name=name, list_id=list_id)

    existing_count = ShoppingCategory.query.filter_by(list_id=list_id).count()
    if existing_count >= 10:
        return jsonify({"error": "Category limit reached. A shopping list can have a maximum of 10 categories."}), 400
        
    db.session.add(category)
    db.session.commit()

    return jsonify(category.to_dict()), 201


@shopping_category_routes.route("/<int:id>", methods=["PATCH"])
@login_required
def edit_category(id):
    category = ShoppingCategory.query.get_or_404(id)
    data = request.get_json() or {}

    if "name" in data:
        name = data["name"]
        if not name or not name.strip():
            return jsonify({"error": "Name must be a non-empty string"}), 400

        duplicate = (
            ShoppingCategory.query
            .filter(
                ShoppingCategory.list_id == category.list_id,
                ShoppingCategory.id != id,
                func.lower(func.trim(ShoppingCategory.name)) == func.lower(func.trim(name)),
            )
            .first()
        )
        if duplicate:
            return jsonify({"error": "Category name already exists in this list"}), 409

        category.name = name.strip()

    db.session.commit()
    return jsonify(category.to_dict()), 200


@shopping_category_routes.route("/<int:id>", methods=["DELETE"])
@login_required
def delete_shopping_category(id):
    category = ShoppingCategory.query.get_or_404(id)
    db.session.delete(category)
    db.session.commit()
    return jsonify({"message": "Shopping category deleted"}), 200