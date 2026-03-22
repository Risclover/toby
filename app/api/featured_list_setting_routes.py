from flask import Blueprint, jsonify, request
from app.models import FeaturedListSetting, User, Tasklist 
from app.extensions import db
from flask_login import current_user, login_required

featured_list_setting_routes = Blueprint("featured-list-settings", __name__)

@featured_list_setting_routes.route("")
@login_required
def get_featured_list_settings():
    user_settings = FeaturedListSetting.query.filter_by(user_id=current_user.id).first()

    if not user_settings:
        user_settings = FeaturedListSetting(user_id=current_user.id)
        db.session.add(user_settings)
        db.session.commit()

    return jsonify(user_settings.to_dict()), 200

@featured_list_setting_routes.route("", methods=["PUT"])
@login_required
def update_featured_list_settings():
    user_settings = FeaturedListSetting.query.filter_by(user_id=current_user.id).first()

    if not user_settings:
        user_settings = FeaturedListSetting(user_id=current_user.id)
        db.session.add(user_settings)

    data = request.get_json() or {}

    if 'featuredTasklist' in data:
        tasklist_data = data['featuredTasklist']
        
        # 1. Handle flat fields
        field_mapping = {
            "tasklistId": "tasklist_id",
            "justMeFilter": "filter_just_me",
            "importantOnly": "important_only",
            "maxItems": "max_items",
            "showCompleted": "show_completed",
            "sortOrder": "sort_order",
            "view": "view",
            "showProgress": "show_progress",
            "showQuickAdd": "show_quick_add",
        }

        for json_key, model_attr in field_mapping.items():
            if json_key in tasklist_data:
                setattr(user_settings, model_attr, tasklist_data[json_key])

        # 2. Handle nested urgency filter explicitly
        if 'urgencyFilter' in tasklist_data:
            urgency_data = tasklist_data['urgencyFilter']
            if 'overdue' in urgency_data:
                user_settings.filter_overdue = urgency_data['overdue']
            if 'dueToday' in urgency_data:
                user_settings.filter_due_today = urgency_data['dueToday']
            if 'dueSoon' in urgency_data:
                user_settings.filter_due_soon = urgency_data['dueSoon']
    
    db.session.commit()
    return jsonify(user_settings.to_dict()), 200

@featured_list_setting_routes.route("/reset", methods=["POST"])
@login_required
def reset_user_settings():
    user_settings = FeaturedListSetting.query.filter_by(user_id=current_user.id).first()

    if user_settings:
        db.session.delete(user_settings)
    
    user_settings = FeaturedListSetting(user_id=current_user.id)
    db.session.add(user_settings)
    db.session.commit()

    return jsonify(user_settings.to_dict()), 200

@featured_list_setting_routes.route("/featured-tasklist", methods=["PATCH"])
@login_required
def toggle_featured_tasklist():
    user_settings = FeaturedListSetting.query.filter_by(user_id=current_user.id).first()

    if not user_settings:
        user_settings = FeaturedListSetting(user_id=current_user.id)
        db.session.add(user_settings)

    data = request.get_json() or {}
    tasklist_id = data.get('tasklistId')

    if not tasklist_id:
        return jsonify({"error": "No tasklist ID provided"}), 400

    if user_settings.tasklist_id == tasklist_id:
        user_settings.tasklist_id = None
    else:
        user_settings.tasklist_id = tasklist_id

    db.session.commit()

    return jsonify({
        "message": "Featured tasklist updated",
        "tasklistId": user_settings.tasklist_id,
        "featuredListSetting": user_settings.to_dict()
    }), 200