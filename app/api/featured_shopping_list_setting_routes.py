from flask import Blueprint, jsonify, request
from app.models import FeaturedShoppingListSetting, User, ShoppingList 
from app.extensions import db
from flask_login import current_user, login_required

featured_shopping_list_setting_routes = Blueprint("featured-shopping-list-settings", __name__)

@featured_shopping_list_setting_routes.route("")
@login_required
def get_featured_shopping_list_settings():
    user_settings = FeaturedShoppingListSetting.query.filter_by(user_id=current_user.id).first()

    if not user_settings:
        user_settings = FeaturedShoppingListSetting(user_id=current_user.id)
        db.session.add(user_settings)
        db.session.commit()

    return jsonify(user_settings.to_dict()), 200

@featured_shopping_list_setting_routes.route("", methods=["PUT"])
@login_required
def update_featured_shopping_list_settings():
    user_settings = FeaturedShoppingListSetting.query.filter_by(user_id=current_user.id).first()

    if not user_settings:
        user_settings = FeaturedShoppingListSetting(user_id=current_user.id)
        db.session.add(user_settings)

    data = request.get_json() or {}

    if "featuredShoppingList" in data:
        list_data = data["featuredShoppingList"]

        field_mapping = {
            "listId": "list_id",
            "maxItems": "max_items",
            "showCompleted": "show_completed",
            "sortOrder": "sort_order",
            "categoryGroups": "category_groups",
            "showProgress": "show_progress",
            "showQuickAdd": "show_quick_add",
            "view": "view"
        }

        for json_key, model_attr in field_mapping.items():
            if json_key in list_data:
                setattr(user_settings, model_attr, list_data[json_key])
        
    db.session.commit()
    return jsonify(user_settings.to_dict()), 200

@featured_shopping_list_setting_routes.route("/reset", methods=["POST"])
@login_required
def reset_user_settings():
    user_settings = FeaturedShoppingListSetting.query.filter_by(user_id=current_user.id).first()

    if user_settings:
        db.session.delete(user_settings)
    
    user_settings = FeaturedShoppingListSetting(user_id=current_user.id)
    db.session.add(user_settings)
    db.session.commit()
    
    return jsonify(user_settings.to_dict()), 200

@featured_shopping_list_setting_routes.route("/featured-shopping-list", methods=["PATCH"])
@login_required
def toggle_featured_shopping_list():
    user_settings = FeaturedShoppingListSetting.query.filter_by(user_id=current_user.id).first()

    if not user_settings:
        user_settings = FeaturedShoppingListSetting(user_id=current_user.id)
        db.session.add(user_settings)
    
    data = request.get_json() or {}
    list_id = data.get("listId")

    if not list_id:
        return jsonify({ "error": "No list ID provided" }), 400
    
    if user_settings.list_id == list_id:
        user_settings.list_id = None
    else:
        user_settings.list_id = list_id
    
    db.session.commit()

    return jsonify({
        "message": "Featured shopping list updated",
        "listId": user_settings.list_id,
        "featuredShoppingListSetting": user_settings.to_dict()
    }), 200

