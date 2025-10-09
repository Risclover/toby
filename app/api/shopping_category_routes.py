from flask import Blueprint, request, jsonify
from app.models import ShoppingCategory
from app.extensions import db

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

