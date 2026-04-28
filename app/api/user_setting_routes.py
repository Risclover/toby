from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from app.extensions import db
from app.models import UserSettings, User, Theme, PrivacyMode

user_setting_routes = Blueprint("user-settings", __name__)


def _ensure_user_settings(user_id: int) -> UserSettings:
    """Get or create UserSettings for the given user."""
    user_settings = UserSettings.query.filter_by(user_id=user_id).first()
    if not user_settings:
        user_settings = UserSettings(user_id=user_id)
        db.session.add(user_settings)
        db.session.commit()
    return user_settings

@user_setting_routes.route("/<int:id>", methods=["GET"])
@login_required
def get_user_settings(id):
    user = User.query.get(id)
    if not user:
        return jsonify({ "error": "User not found" }), 404

    user_settings = _ensure_user_settings(id)

    return jsonify({
        "user": user.to_dict(),
        "settings": user_settings.to_dict()
    }), 200

@user_setting_routes.route("", methods=["GET"])
@login_required
def get_current_user_settings():
    user = User.query.get(current_user.id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    user_settings = _ensure_user_settings(current_user.id)

    return jsonify({
        "user": user.to_dict(),
        "settings": user_settings.to_dict(),
    }), 200


@user_setting_routes.route("", methods=["PUT"])
@login_required
def update_user_settings():
    user = User.query.get(current_user.id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    user_settings = _ensure_user_settings(current_user.id)
    data = request.get_json() or {}

    # Core user fields
    if "firstName" in data:
        user.first_name = data["firstName"]

    if "lastName" in data:
        user.last_name = data["lastName"]

    if "timezone" in data:
        user.timezone = data["timezone"]

    # Settings: booleans
    if "habitsOnHomepage" in data:
        user_settings.habits_on_homepage = bool(data["habitsOnHomepage"])

    # Settings: enums (with validation)
    if "siteTheme" in data:
        try:
            user_settings.site_theme = Theme(data["siteTheme"])
        except ValueError:
            return jsonify({"error": "Invalid siteTheme"}), 400

    if "habitsPrivacyMode" in data:
        try:
            user_settings.habits_privacy_mode = PrivacyMode(data["habitsPrivacyMode"])
        except ValueError:
            return jsonify({"error": "Invalid habitsPrivacyMode"}), 400

    if "notesPrivacyMode" in data:
        try:
            user_settings.notes_privacy_mode = PrivacyMode(data["notesPrivacyMode"])
        except ValueError:
            return jsonify({"error": "Invalid notesPrivacyMode"}), 400

    db.session.commit()

    return jsonify({
        "user": user.to_dict(),
        "settings": user_settings.to_dict(),
    }), 200

@user_setting_routes.route("/reset", methods=["POST"])
@login_required
def reset_settings():
    user_settings = UserSettings.query.filter_by(user_id=current_user.id).first()
    
    if user_settings:
        db.session.delete(user_settings)
        db.session.flush()  # Clean up before recreating
    
    # Recreate with defaults
    user_settings = UserSettings(user_id=current_user.id)
    db.session.add(user_settings)
    db.session.commit()

    user = User.query.get(current_user.id)
    return jsonify({
        "user": user.to_dict(),
        "settings": user_settings.to_dict(),
    }), 200
    