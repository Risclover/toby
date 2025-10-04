from flask import Blueprint, request, jsonify
from app.models import ShoppingCategory
from app.extensions import db

shopping_category_routes = Blueprint("shopping_categories", __name__)

@shopping_category_routes.route("/")
def get_list_categories():
    data = request.get_json()
    list_id = data.get("shoppingListId")

    if not list_id:
        return jsonify({"error": "shoppingListId is required"}), 400

    categories = ShoppingCategory.query.filter_by(shopping_list_id=list_id).all()

    return jsonify([category.to_dict() for category in categories]), 200

