from flask import Blueprint, request, jsonify
from app.models import ShoppingCategory, ShoppingList
from app.extensions import db
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

shopping_category_routes = Blueprint("shopping_categories", __name__)

@shopping_category_routes.route("")
def get_list_categories():
    data = request.get_json()
    list_id = data.get("listId")

    if not list_id:
        return jsonify({"error": "listId is required"}), 400

    categories = ShoppingCategory.query.filter_by(list_id=list_id).all()

    return jsonify([category.to_dict() for category in categories]), 200


@shopping_category_routes.route("", methods=["POST"])
def create_shopping_category():
    data = request.get_json()
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


@shopping_category_routes.route("/<int:id>", methods=["PUT"])
def edit_category(id):
    category = ShoppingCategory.query.get(id)

    if not category:
        return jsonify({"error": "Shopping category not found"}), 404

    data = request.get_json()
    name = data["name"]

    category.name = name 
    db.session.commit()

    return jsonify({"message": "Shopping category edited successfully"}), 200