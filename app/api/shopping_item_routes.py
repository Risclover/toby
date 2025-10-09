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