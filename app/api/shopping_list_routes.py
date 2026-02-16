# app/routes/shopping_list_routes.py
from flask import Blueprint, jsonify, request
from app.extensions import db 
from app.models import ShoppingList, ShoppingItem

shopping_list_routes = Blueprint("shopping-lists", __name__)

@shopping_list_routes.route("/<int:id>")
def get_shopping_list(id):
    list = ShoppingList.query.get(id)
    if not list:
        return jsonify({"error": "Shopping list not found"}), 404
    return jsonify(list.to_dict()), 200

@shopping_list_routes.route("/", methods=["POST"])
def create_shopping_list():
    data = request.get_json() or {}
    title = data.get("title")
    user_id = data.get("userId")
    household_id = data.get("householdId")

    if not title:
        return jsonify({"error": "Title is required"}), 400
    
    list = ShoppingList(
        title=title,
        household_id=household_id
    )

    db.session.add(list)
    db.session.commit()

    return jsonify(list.to_dict()), 201

@shopping_list_routes.route("/<int:id>", methods=["PUT"])
def update_shopping_list_info(id):
    list = ShoppingList.query.get(id)
    if not list:
        return jsonify({"error": "Shopping list not found"}), 404

    data = request.get_json() or {}
    title = data.get("title")
    if title:
        list.title = title
        db.session.commit()

    return jsonify(list.to_dict()), 200

@shopping_list_routes.route("/<int:id>", methods=["DELETE"])
def delete_shopping_list(id):
    list = ShoppingList.query.get(id)
    if not list:
        return jsonify({"error": "Shopping list not found"}), 404

    db.session.delete(list)
    db.session.commit()
    return jsonify({"message": "Shopping list deleted"}), 200

@shopping_list_routes.route("/<int:id>/items", methods=["POST"])
def add_item_to_shopping_list(id):
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    category_id = data.get("categoryId")
    quantity = int(data.get("quantity") or 1)
    purchased = bool(data.get("purchased") or False)

    if not name:
        return jsonify({"error": "name is required"}), 400

    shopping_list = ShoppingList.query.get(id)
    if not shopping_list:
        return jsonify({"error": "Shopping list not found"}), 404

    item = ShoppingItem(
        name=name,
        category_id=category_id,
        quantity=quantity,
        purchased=purchased,
        list_id=id,
    )

    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201

@shopping_list_routes.route("/<int:id>/items", methods=["GET"])
def get_shopping_list_items(id):
    shopping_list = ShoppingList.query.get(id)
    if not shopping_list:
        return jsonify({"error": "Shopping list not found"}), 404

    return jsonify([i.to_dict() for i in shopping_list.items or []]), 200

@shopping_list_routes.route("/<int:id>/categories", methods=["GET"])
def get_shopping_list_categories(id):
    shopping_list = ShoppingList.query.get(id)
    if not shopping_list:
        return jsonify({"error": "Shopping list not found"}), 404

    return jsonify([c.to_dict() for c in shopping_list.categories or []]), 200