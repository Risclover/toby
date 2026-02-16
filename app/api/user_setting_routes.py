from flask import Blueprint, jsonify, request
from app.models import UserSetting, User, Tasklist 
from app.extensions import db
from flask_login import current_user, login_required

user_setting_routes = Blueprint("user-settings", __name__)

@user_setting_routes.route("")
@login_required
def get_user_settings():
    user_settings = UserSetting.query.filter_by(user_id=current_user.id).first()

    if not user_settings:
        user_settings = UserSetting(user_id=current_user.id)
        db.session.add(user_settings)
        db.session.commit()

    return jsonify(user_settings.to_dict()), 200

@user_setting_routes.route("", methods=["PUT"])
@login_required
def update_user_settings():
    user_settings = UserSetting.query.filter_by(user_id=current_user.id).first()

    if not user_settings:
        user_settings = UserSetting(user_id=current_user.id)
        db.session.add(user_settings)

    data = request.get_json() or {}

    if 'featuredTasklist' in data:
        tasklist_data = data['featuredTasklist']
        field_mapping = {
            "rotation": "featured_tasklist_rotation",
            "assigneeFilter": "featured_tasklist_assignee_filter",
            "urgencyFilter": "featured_tasklist_urgency_filter",
            "importantOnly": "featured_tasklist_important_only",
            "maxItems": "featured_tasklist_max_items",
            "showCompleted": "featured_tasklist_show_completed",
            "sortOrder": "featured_tasklist_sort_order",
            "view": "featured_tasklist_view",
            "showProgress": "featured_tasklist_show_progress",
            "showQuickAdd": "featured_tasklist_show_quick_add"
        }

        for json_key, model_attr in field_mapping.items():
            if json_key in tasklist_data:
                setattr(user_settings, model_attr, tasklist_data[json_key])
    
    db.session.commit()
    return jsonify(user_settings.to_dict()), 200

@user_setting_routes.route("/reset", methods=["POST"])
@login_required
def reset_user_settings():
    user_settings = UserSetting.query.filter_by(user_id=current_user.id).first()

    if user_settings:
        db.session.delete(user_settings)
    
    user_settings = UserSetting(user_id=current_user.id)
    db.session.add(user_settings)
    db.session.commit()

    return jsonify(user_settings.to_dict()), 200