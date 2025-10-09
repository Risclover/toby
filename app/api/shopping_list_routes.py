from flask import Blueprint, jsonify, request
from app.extensions import db 
from app.models import ShoppingList, User, ShoppingItem

shopping_list_routes = Blueprint("shopping_lists", __name__)

@shopping_list_routes.route("/<int:id>")
def get_shopping_list(id):
    list = ShoppingList.query.get(id)
    return list.to_dict()

@shopping_list_routes.route("/", methods=["POST"])
def create_shopping_list():
    data = request.get_json()
    title = data.get("title")
    user_id = data.get("userId")
    household_id = data.get("householdId")

    if not title:
        return jsonify({"error": "Title is required"}), 400
    
    list = ShoppingList(
        title=title,
        user_id=user_id,
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

    data = request.get_json()

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
    category = (data.get("category") or "").strip() or None
    quantity = int(data.get("quantity") or 1)
    purchased = bool(data.get("purchased") or False)

    if not name:
        return jsonify({"error": "name is required"}), 400

    shopping_list = ShoppingList.query.get(id)

    if not shopping_list:
        return jsonify({"error": "Shopping list not found"}), 404

    item = ShoppingItem(
        name=name,
        category=category,
        quantity=quantity,
        purchased=purchased,
        shopping_list_id=id,  # this alone is enough
    )

    db.session.add(item)
    db.session.commit()

    return jsonify(item.to_dict()), 201


@shopping_list_routes.route("/<int:id>/items", methods=["GET"])
def get_shopping_list_items(id):
    shopping_list = ShoppingList.query.get(id)

    if not shopping_list:
        return jsonify({"error": "Shopping list not found"}), 404

    items = shopping_list.items or []
    return jsonify([i.to_dict() for i in items]), 200


@shopping_list_routes.route("/<int:id>", methods=["PUT"])
def edit_shopping_list_info(id):
    list = ShoppingList.query.get(id)

    if not list:
        return jsonify({"error": "Shopping list not found"}), 404

    data = request.get_json()

    title = data.get("title")
    if title:
        list.title = title
        db.session.commit()

    return jsonify(list.to_dict()), 200



@shopping_list_routes.route("/<int:id>/categories", methods=["GET"])
def get_shopping_list_categories(id):
    shopping_list = ShoppingList.query.get(id)

    if not shopping_list:
        return jsonify({"error": "Shopping list not found"}), 404

    categories = shopping_list.categories or []
    return jsonify([c.to_dict() for c in categories]), 200