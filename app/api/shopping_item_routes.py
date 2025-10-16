from flask import Blueprint, request, jsonify
from app.models import ShoppingItem
from app.extensions import db

shopping_item_routes = Blueprint("shopping_items", __name__)

@shopping_item_routes.route("/<int:id>")
def get_shopping_item(id):
    item = ShoppingItem.query.get(id)
    return item.to_dict()

@shopping_item_routes.route("/<int:id>", methods=["PUT"])
def update_shopping_item(id):
    item = ShoppingItem.query.get(id)

    if not item:
        return jsonify({"error": "Shopping item not found"}), 404

    data = request.get_json()

    for field in ("name", "category", "quantity", "purchased"):
        if field in data:
            setattr(item, field, data[field])

    db.session.commit()
    return jsonify(item.to_dict()), 200

@shopping_item_routes.route("/<int:id>", methods=["DELETE"])
def delete_shopping_item(id):               
    item = ShoppingItem.query.get(id)

    if not item:
        return jsonify({"error": "Shopping item not found"}), 404

    db.session.delete(item)
    db.session.commit()

    return jsonify({"message": "Shopping item deleted"}), 200
    

@shopping_item_routes.route("/<int:id>/toggle", methods=["PUT"])
def toggle_shopping_item(id):
    item = ShoppingItem.query.get(id)

    if not item:
        return jsonify({"error": "Shopping item not found"}), 404

    item.purchased = not item.purchased
    db.session.commit()

    return jsonify(item.to_dict()), 200


@shopping_item_routes.route("/<int:id>/category", methods=["GET"])
def get_shopping_item_category(id):
    item = ShoppingItem.query.get(id)

    if not item:
        return jsonify({"error": "Shopping item not found"}), 404

    if not item.category:
        return jsonify({"error": "Shopping item has no category"}), 404

    return jsonify(item.category.to_dict()), 200

# /shopping_items/2/category
@shopping_item_routes.route("/<int:id>/category", methods=["PUT"])
def update_shopping_item_category(id):
    item = ShoppingItem.query.get(id)

    if not item:
        return jsonify({"error": "Shopping item not found"}), 404

    data = request.get_json()
    category_id = data.get("categoryId")

    if category_id is None:
        item.category = None
    else
        from app.models import ShoppingCategory
        category = ShoppingCategory.query.filter_by(id=category_id, list_id=item.list_id).first()
        if not category:
            return jsonify({"error": "Category not found in this shopping list"}), 404
        item.category_id = category.id
        item.category = category

    db.session.commit()
    return jsonify(item.to_dict()), 200

@shopping_item_routes.route("/<int:id>/quantity", methods=["PUT"])
def update_shopping_item_quantity(id):
    item = ShoppingItem.query.get(id)

    if not item:
        return jsonify({"error": "Shopping item not found"}), 404

    data = request.get_json()
    quantity = data.get("quantity")

    if quantity is None or not isinstance(quantity, int) or quantity < 1:
        return jsonify({"error": "Quantity must be a positive integer"}), 400

    item.quantity = quantity
    db.session.commit()
    return jsonify(item.to_dict()), 200 

@shopping_item_routes.route("/<int:id>/name", methods=["PUT"])
def update_shopping_item_name(id):
    item = ShoppingItem.query.get(id)

    if not item:
        return jsonify({"error": "Shopping item not found"}), 404

    data = request.get_json()
    name = data.get("name")

    if not name or not isinstance(name, str) or not name.strip():
        return jsonify({"error": "Name must be a non-empty string"}), 400

    item.name = name.strip()
    db.session.commit()
    return jsonify(item.to_dict()), 200 

@shopping_item_routes.route("/<int:id>/notes", methods=["PUT"])
def update_shopping_item_notes(id):
    item = ShoppingItem.query.get(id)

    if not item:
        return jsonify({"error": "Shopping item not found"}), 404

    data = request.get_json()
    notes = data.get("notes")

    if notes is not None and not isinstance(notes, str):
        return jsonify({"error": "Notes must be a string"}), 400

    item.notes = notes.strip() if notes else None
    db.session.commit()
    return jsonify(item.to_dict()), 200 