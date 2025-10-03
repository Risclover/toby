from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.models import Mood 
from app.extensions import db
from app.models.mood import MoodEnum

mood_routes = Blueprint("moods", __name__)

@mood_routes.route("/me", methods=["GET"])
@login_required
def get_my_mood():
    row = Mood.query.filter_by(user_id=current_user.id).first()
    return jsonify(row.to_dict() if row else None), 200

@mood_routes.route("/me", methods=["PUT"])
@login_required
def set_my_mood():
    data = request.get_json() or {}
    mood = data.get("mood")
    row = Mood.query.filter_by(user_id=current_user.id).first()

    if not mood or mood not in getattr(MoodEnum, "enums", []):
        return jsonify({"error": "Invalid mood", "allowed": list(MoodEnum.enums)}), 400

    if not row:
        row = Mood(user_id=current_user.id, mood=mood)
        db.session.add(row)
    else:
        row.mood = mood

    db.session.commit()
    return jsonify(row.to_dict()), 200

@mood_routes.route("/me", methods=["DELETE"])
@login_required
def clear_my_mood():
    row = Mood.query.filter_by(user_id=current_user.id).first()
    if row:
        db.session.delete(row)
        db.session.commit()
    return jsonify({"ok": True}), 200