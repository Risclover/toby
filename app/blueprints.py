from importlib import import_module

_BLUEPRINT_PATHS = (
    "app.api.auth_routes:auth_routes",
    "app.api.household_routes:household_routes",
    "app.api.user_routes:user_routes",
    "app.api.tasklist_routes:tasklist_routes",
    "app.api.task_routes:task_routes",
    "app.api.announcement_routes:announcement_routes",
    "app.api.event_routes:event_routes",
    "app.api.mood_routes:mood_routes",
    "app.api.shopping_list_routes:shopping_list_routes",
    "app.api.shopping_item_routes:shopping_item_routes",
    "app.api.shopping_category_routes:shopping_category_routes",   
    "app.api.reminder_routes:reminder_routes",
    "app.api.featured_list_setting_routes:featured_list_setting_routes",
    "app.api.activity_event_routes:activity_routes",
    "app.api.habit_routes:habit_routes"
)

def register_blueprints(app):
    for dotted in _BLUEPRINT_PATHS:
        module_path, bp_name = dotted.split(":")
        bp = getattr(import_module(module_path), bp_name)
        app.register_blueprint(bp, url_prefix=f"/api/{bp.name}")
