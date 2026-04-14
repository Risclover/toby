from flask import Blueprint, request, jsonify, abort
from flask_login import current_user, login_required
from app.extensions import db
from app.models import User, Household, PersonalNote, PersonalNoteCategory
from datetime import date 

personal_note_category_routes = Blueprint("personal-note-categories", __name__)

@personal_note_category_routes.route("/", methods=["GET"])
@login_required
def get_note_categories():
    categories = PersonalNoteCategory.query.filter_by(user_id=current_user.id).all()
    return {"categories": [category.to_dict() for category in categories]}, 200

@personal_note_category_routes.route("/<int:id>")
@login_required
def get_note_category(id):
    category = PersonalNoteCategory.query.get(id)

    if not category:
        return {"error": "Category doesn't exist"}, 404
    if category.user_id != current_user.id:
        return {"error": "Forbidden"}, 403

    return category.to_dict(), 200

@personal_note_category_routes.route("", methods=["POST"])
@login_required
def create_note_category():
    data = request.get_json()

    name = data.get("name", "").strip()
    if not name:
        return {"error": "Name is required"}, 400
    color = data.get("color") or "rgb(5, 5, 73)"

    category = PersonalNoteCategory(
        name=name,
        color=color,
        user_id=current_user.id
    )

    db.session.add(category)
    db.session.commit()
    
    return category.to_dict(), 201

@personal_note_category_routes.route("/<int:id>", methods=["PUT"])
@login_required
def edit_note_category(id):
    category = PersonalNoteCategory.query.get(id)

    if not category:
        return {"error": "Category does not exist"}, 404
    if category.user_id != current_user.id:
        return {"error": "Forbidden"}, 403

    data = request.get_json()
    
    name = data.get("name", "").strip()
    if not name:
        return {"error": "Name is required"}, 400
    color = data.get("color") or "rgb(5, 5, 73)"

    category.name = name
    category.color = color 

    db.session.commit()

    return category.to_dict(), 200

@personal_note_category_routes.route("/<int:id>", methods=["DELETE"])
@login_required
def delete_note_category(id):
    category = PersonalNoteCategory.query.get(id)

    if not category:
        return {"error": "Category does not exist"}, 404
    if category.user_id != current_user.id:
        return {"error": "Forbidden"}, 403  

    db.session.delete(category)
    db.session.commit()

    return {"message": "Category successfully deleted"}, 200