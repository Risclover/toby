from flask import Blueprint, request, jsonify
from flask_login import current_user, login_required
from app.models import ShoppingItem, ShoppingCategory, ShoppingItemUnit
from app.extensions import db

shopping_item_unit_routes = Blueprint("shopping-item-units", __name__)

@shopping_item_unit_routes.route("", methods=["GET"])
@login_required
def get_user_shopping_item_units():
    units = ShoppingItemUnit.query.filter_by(user_id=current_user.id).all()
    return jsonify([unit.to_dict() for unit in units]), 200

@shopping_item_unit_routes.route("", methods=["POST"])
@login_required
def create_unit():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body is required"}), 400
        
    name = data.get("name", "").strip()

    if not name:
        return jsonify({ "error": "Name is required" }), 400
    
    if len(name) > 15:
        return jsonify({ "error": "Name must be 15 characters or less" }), 400
    
    existing = ShoppingItemUnit.query.filter(
        ShoppingItemUnit.user_id == current_user.id,
        db.func.lower(ShoppingItemUnit.name) == name.lower()
    ).first()

    if existing:
        return jsonify({ "error": "You already have a unit with that name" }), 400

    unit = ShoppingItemUnit(
        user_id=current_user.id,
        name=data["name"]
    )

    db.session.add(unit)
    db.session.commit()

    return jsonify(unit.to_dict()), 201

@shopping_item_unit_routes.route("/<int:id>", methods=["DELETE"])
@login_required
def delete_unit(id):
    unit = ShoppingItemUnit.query.get(id)

    if not unit:
        return jsonify({"error": "Unit not found"}), 404
    
    if unit.user_id != current_user.id:
        return jsonify({ "error": "Unauthorized" }), 403

    db.session.delete(unit)
    db.session.commit()

    return jsonify({"message": "Unit deleted"}), 200

    