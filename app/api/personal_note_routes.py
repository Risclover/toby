from flask import Blueprint, request, jsonify, abort
from flask_login import current_user, login_required
from app.extensions import db
from app.models import User, Household, PersonalNote
from datetime import date 
from app.s3_helpers import allowed_file, get_unique_filename, upload_file_to_s3

personal_note_routes = Blueprint("personal-notes", __name__)

@personal_note_routes.route("/<int:id>", methods=["GET"])
@login_required
def get_note(id):
    note = PersonalNote.query.get(id)

    if not note:
        return {"error": "Note not found"}, 404
    if note.user_id != current_user.id:
        return {"error": "Forbidden"}, 403

    return note.to_dict(), 200


@personal_note_routes.route("/", methods=["POST"])
@login_required
def create_note():
    data = request.get_json()
    body = data.get("body", "").strip()
    title = data.get("title", "").strip() or None
    color = data.get("color")
    is_private = data.get("isPrivate") or False

    if not body:
        return {"error": "Body is required"}, 400
    if len(body) > 10000:
        return {"error": "Body must be 10,000 characters or fewer"}, 400

    note = PersonalNote(
        user_id=current_user.id,
        title=title,
        body=body,
        color=color,
        is_private=is_private
    )
    db.session.add(note)
    db.session.commit()
    return note.to_dict(), 201


@personal_note_routes.route("/<string:id>", methods=["PUT"])
@login_required
def update_note(id):
    note = PersonalNote.query.get(id)

    if not note:
        return {"error": "Note not found"}, 404
    if note.user_id != current_user.id:
        return {"error": "Forbidden"}, 403

    data = request.get_json()
    body = data.get("body", "").strip()
    title = data.get("title", "").strip() or None
    color = data.get("color")
    is_private = data.get("isPrivaate") or False

    if not body:
        return {"error": "Body is required"}, 400
    if len(body) > 10000:
        return {"error": "Body must be 10,000 characters or fewer"}, 400

    note.title = title
    note.body = body
    note.is_private = is_private
    note.color = color
    db.session.commit()
    return note.to_dict(), 200


@personal_note_routes.route("/<int:id>", methods=["DELETE"])
@login_required
def delete_note(id):
    note = PersonalNote.query.get(id)

    if not note:
        return {"error": "Note not found"}, 404
    if note.user_id != current_user.id:
        return {"error": "Forbidden"}, 403

    db.session.delete(note)
    db.session.commit()
    return {"message": "Note deleted"}, 200

@personal_note_routes.route("/images", methods=["POST"])
@login_required
def upload_note_image():
    if "image" not in request.files:
        return {"error": "Image required"}, 400

    image = request.files["image"]

    if not allowed_file(image.filename):
        return {"error": "File type not permitted"}, 400

    image.filename = get_unique_filename(image.filename)
    upload = upload_file_to_s3(image)

    if "url" not in upload:
        return upload, 400

    return {"url": upload["url"]}, 200
    
@personal_note_routes.route("/<string:id>/category", methods=["PATCH"])
@login_required
def update_note_category(id):
    note = PersonalNote.query.get(id)

    if not note:
        return {"error": "Note not found"}, 404
    if note.user_id != current_user.id:
        return {"error": "Forbidden"}, 403

    data = request.get_json()
    category_id = data.get("categoryId")

    if category_id is not None:
        category = PersonalNoteCategory.query.get(category_id)
        if not category:
            return {"error": "Category not found"}, 404
        if category.user_id != current_user.id:
            return {"error": "Forbidden"}, 403

    note.category_id = category_id  # None removes the category
    db.session.commit()

    return note.to_dict(), 200

