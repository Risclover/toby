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
        
        # 1. Handle flat fields
        field_mapping = {
            "featuredTasklistId": "featured_tasklist_id",
            "rotation": "featured_tasklist_rotation",
            "justMeFilter": "featured_tasklist_filter_just_me",
            "importantOnly": "featured_tasklist_important_only",
            "maxItems": "featured_tasklist_max_items",
            "showCompleted": "featured_tasklist_show_completed",
            "sortOrder": "featured_tasklist_sort_order",
            "view": "featured_tasklist_view",
            "showProgress": "featured_tasklist_show_progress",
            "showQuickAdd": "featured_tasklist_show_quick_add",
        }

        for json_key, model_attr in field_mapping.items():
            if json_key in tasklist_data:
                setattr(user_settings, model_attr, tasklist_data[json_key])

        # 2. Handle nested urgency filter explicitly
        if 'urgencyFilter' in tasklist_data:
            urgency_data = tasklist_data['urgencyFilter']
            if 'overdue' in urgency_data:
                user_settings.featured_tasklist_filter_overdue = urgency_data['overdue']
            if 'dueToday' in urgency_data:
                user_settings.featured_tasklist_filter_due_today = urgency_data['dueToday']
            if 'dueSoon' in urgency_data:
                user_settings.featured_tasklist_filter_due_soon = urgency_data['dueSoon']
    
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

@user_setting_routes.route("/featured-tasklist", methods=["PATCH"])
@login_required
def toggle_featured_tasklist():
    user_settings = UserSetting.query.filter_by(user_id=current_user.id).first()

    if not user_settings:
        user_settings = UserSetting(user_id=current_user.id)
        db.session.add(user_settings)

    data = request.get_json() or {}
    tasklist_id = data.get('tasklistId')

    if not tasklist_id:
        return jsonify({"error": "No tasklist ID provided"}), 400

    if user_settings.featured_tasklist_id == tasklist_id:
        user_settings.featured_tasklist_id = None
    else:
        user_settings.featured_tasklist_id = tasklist_id

    db.session.commit()

    return jsonify({
        "message": "Featured tasklist updated",
        "featuredTasklistId": user_settings.featured_tasklist_id,
        "userSettings": user_settings.to_dict()
    }), 200