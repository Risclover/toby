# routes/tasklists.py
from flask import Blueprint, jsonify, request
from app.models import Tasklist, Task, User, Household, TasklistMember, UserSetting
from app.extensions import db
from flask_login import current_user, login_required
from app.models.tasklist import SortOrder
from app.utils.reminder_utils import create_task_due_reminders
import pytz
from datetime import datetime, date

tasklist_routes = Blueprint("tasklists", __name__)

# TABLE OF CONTENTS
# 1. get_tasklist: Retrieve tasklist by id
# 2. get_tasklists: Get all of a scope's tasklists (user's or household's)
# 3. create_tasklist: Create task list
# 4. add_task: Add task to task list
# 7. delete_task: Remove task from list
# 8. clear_list: Clear list by removing all tasks
# 9. delete_list: Delete tasklist
# 10. reorder_tasks: Reorder tasklist (drag and drop)
# 11. duplicate_list: Duplicate tasklist
# 12. archive_list: Archive tasklist 
# 13. update_list_settings: Update tasklist settings
# 14. complete_all_tasks: Mark all tasks in a tasklist as "completed"
# 15. incomplete_all_tasks: Mark all tasks in a tasklist as "in_progress" (incompleted)
# 16. manage_assigned_members: Manage a tasklist's assigned members

@tasklist_routes.route("/<int:id>", methods=["GET"])
def get_tasklist(id):
    """
    Get a specific task list by id 
    """
    tasklist = Tasklist.query.get_or_404(id)
    return jsonify(tasklist.to_dict()), 200

@tasklist_routes.route("/<int:id>", methods=["GET"])
@login_required
def get_tasklists(id):
    """
    Get a specific user's or household's task lists
    """
    scope = request.args.get("scope", "user")

    if scope == "user":
        lists = Tasklist.query.filter_by(user_id=current_user.id).all()

    elif scope == "household":
        only_archived_lists = request.args.get("archived") == "true"
        household_id = request.args.get("householdId", type=int)
        if not household_id:
            return jsonify({"error": "householdId required"}), 400

        # Optional but good: verify the household exists & the user belongs
        household = Household.query.get(household_id)
        if not household:
            return jsonify({"error": "Household not found"}), 404
        if not current_user.is_member_of(household):  # implement this helper
            return jsonify({"error": "Forbidden"}), 403

        if only_archived_lists:
            lists = Tasklist.query.filter_by(household_id=household_id, is_archived=True).all()
        else:
            lists = Tasklist.query.filter_by(household_id=household_id, is_archived=False).all()

    else:
        return jsonify({"error": "invalid scope"}), 400

    return jsonify([t.to_dict() for t in lists]), 200  # [] when empty


@tasklist_routes.route("", methods=["POST"])
def create_tasklist():
    """
    Create a new task list 
    """
    data = request.get_json()

    tasklist = Tasklist(
        title=data["title"],
        user_id=data.get("user_id"),
        household_id=data.get("household_id")
    )
    
    db.session.add(tasklist)
    
    household = Household.query.get(data.get("household_id"))
    household.tasklists.append(tasklist)

    db.session.commit()

    return jsonify(tasklist.to_dict()), 201

@tasklist_routes.route("/<int:id>/tasks", methods=["POST"])
def add_task(id):
    data = request.get_json() or {}
    tasklist = Tasklist.query.get_or_404(id)

    # determine sort_index
    new_sort_index = 0
    if tasklist.new_item_position == "top":
        min_idx = (
            db.session.query(db.func.coalesce(db.func.min(Task.sort_index), 1))
            .filter(Task.list_id == id)
            .scalar()
        )
        new_sort_index = min_idx - 1
    else:
        max_idx = (
            db.session.query(db.func.coalesce(db.func.max(Task.sort_index), -1))
            .filter(Task.list_id == id)
            .scalar()
        )
        new_sort_index = max_idx + 1

    # parse due_date in UTC
    due_date_utc = None
    timezone_str = data.get("timezone") or current_user.timezone or "UTC"
    user_tz = pytz.timezone(timezone_str)

    if data.get("due_date"):
        # convert user's local due date → UTC
        local_due_date = datetime.fromisoformat(data["due_date"])
        due_date_utc = user_tz.localize(local_due_date).astimezone(pytz.UTC).date()

    task = Task(
        title=data["title"],
        creator_id=current_user.id,
        description=data.get("description"),
        status=data.get("status", "pending"),
        is_important=data.get("isImportant", False),
        due_date=due_date_utc,
        assigned_to_id=data.get("assigned_to_id"),
        list_id=id,
        sort_index=new_sort_index,
    )

    db.session.add(task)
    db.session.flush()  # get task.id

    # create automatic reminders
    create_task_due_reminders(task)

    db.session.commit()
    return jsonify(task.to_dict()), 201


@tasklist_routes.route("/<int:list_id>/tasks/<int:id>", methods=["DELETE"])
def delete_task(list_id, id):
    """
    Remove a task from a task list
    """
    task = Task.query.filter_by(id=id, list_id=list_id).first_or_404()
    deleted_task = task.to_dict()

    db.session.delete(task)
    db.session.commit()

    return jsonify(deleted_task), 200


@tasklist_routes.route("/<int:list_id>/tasks", methods=["DELETE"])
def clear_list(list_id):
    """
    Remove all tasks from a list
    """
    Task.query.filter_by(list_id=list_id).delete()
    db.session.commit()
    return jsonify({"message": f"All tasks deleted from list {list_id}"}), 200


@tasklist_routes.route("/<int:id>", methods=["DELETE"])
def delete_list(id):
    """
    Delete a task list
    """
    tasklist = Tasklist.query.get_or_404(id)
    UserSetting.query.filter(UserSetting.featured_tasklist_id==id).update(
        {UserSetting.featured_tasklist_id: None},
        synchronize_session=False
    )
    db.session.delete(tasklist)
    db.session.commit()
    return jsonify({"message": f"List {id} deleted"}), 200


@tasklist_routes.route("/<int:id>", methods=["PUT"])
def edit_tasklist(id):
    """
    Edit task list's title
    """
    tasklist = Tasklist.query.get(id)

    data = request.get_json()
    title = data["title"]
    tasklist.title = title

    db.session.commit()
    return jsonify(tasklist.to_dict()), 200

@tasklist_routes.route("/<int:list_id>/reorder", methods=['PATCH'])
def reorder_tasks(list_id):
    tasklist = Tasklist.query.get_or_404(list_id) # Fixed: use list_id, not id
    
    data = request.get_json() or {}
    ordered_ids = data.get("orderedIds")
    # 🚀 New: Check if the frontend is also requesting a mode change
    set_to_manual = data.get("setToManual", False)

    # Allow reorder if already manual OR if we are switching to manual right now
    if tasklist.default_sort_order != SortOrder.MANUAL.value and not set_to_manual:
        return jsonify({
            "error": "Manual reordering is disabled unless sort order is set to 'manual'."
        }), 400

    if not isinstance(ordered_ids, list) or not ordered_ids:
        return jsonify({ "error": "orderedIds (non-empty array) required"}), 400
    
    # 🚀 Update the sort indices
    for idx, tid in enumerate(ordered_ids):
        (
            db.session.query(Task)
                .filter(Task.id == tid, Task.list_id == list_id)
                .update({Task.sort_index: idx}, synchronize_session=False)
        )
    
    # 🚀 If we are switching modes, update the tasklist setting too
    if set_to_manual:
        tasklist.default_sort_order = SortOrder.MANUAL.value
    
    db.session.commit()
    return jsonify(tasklist.to_dict()), 200 # Return the updated list

@tasklist_routes.route("/<int:id>/duplicate", methods=["POST"])
@login_required
def duplicate_list(id):
    """
    Create an exact copy of an existing tasklist.
    """
    try:
        original_list = Tasklist.query.get_or_404(id)
        
        # Permission check
        if current_user.id not in original_list.audience_user_ids():
            return jsonify({"error": "Access denied"}), 403
        
        new_list = original_list.duplicate()
        db.session.commit()
        
        return jsonify(new_list.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to duplicate list"}), 500

@tasklist_routes.route("/<int:id>/archive", methods=["PUT"])
def archive_list(id):
    """
    Archive the tasklist.
    """
    tasklist = Tasklist.query.get(id)
    tasklist.is_archived = True
    tasklist.archived_by = current_user.id
    db.session.commit()

    return jsonify(tasklist.to_dict())

@tasklist_routes.route("/<int:id>/unarchive", methods=["PUT"])
def unarchive_list(id):
    tasklist = Tasklist.query.get(id)
    if not tasklist:
        return jsonify({"error": "Tasklist not found"}), 404
        
    tasklist.is_archived = False 
    
    db.session.add(tasklist)
    db.session.commit()
    db.session.refresh(tasklist) 

    return jsonify(tasklist.to_dict())

@tasklist_routes.route("/<int:id>/settings", methods=["PUT"])
def update_list_settings(id):
    tasklist = Tasklist.query.get_or_404(id)
    data = request.get_json() or {}

    # 1. Update Standard Settings
    field_mapping = {
        "title": "title",
        "color": "color",
        "viewMode": "view_mode",
        "showCompleted": "show_completed",
        "defaultSortOrder": "default_sort_order",
        "defaultFilters": "default_filters",
        "newItemPosition": "new_item_position",
    }

    for json_key, model_attr in field_mapping.items():
        if json_key in data:
            setattr(tasklist, model_attr, data[json_key])

    # 2. Update Assigned Members (Diff Logic)
    if "memberIds" in data:
        new_member_ids = set(data["memberIds"])

        if tasklist.household:
            household_member_ids = {u.id for u in tasklist.household.members}
            
            # Validation
            invalid_ids = new_member_ids - household_member_ids
            if invalid_ids:
                 return jsonify({
                     "error": "Members must belong to the household", 
                     "invalid": list(invalid_ids)
                 }), 400

            # Logic: Check if "All Members" are selected
            if new_member_ids == household_member_ids:
                tasklist.all_members = True
                # Optimization: If everyone is included, we don't need specific links
                # (Assuming your app logic relies on tasklist.all_members=True to imply everyone)
                for link in tasklist.member_links[:]:
                    db.session.delete(link)
            else:
                tasklist.all_members = False
                
                # --- START DIFF LOGIC ---
                # 1. Get current links
                current_links = {link.user_id: link for link in tasklist.member_links}
                current_ids = set(current_links.keys())
                
                # 2. Calculate what changed
                ids_to_add = new_member_ids - current_ids
                ids_to_remove = current_ids - new_member_ids
                
                # 3. Apply changes (Efficiently)
                # Only delete the members who were actually removed
                for uid in ids_to_remove:
                    db.session.delete(current_links[uid])
                
                # Only add the new members who weren't there before
                for uid in ids_to_add:
                    db.session.add(
                        TasklistMember(tasklist_id=tasklist.id, user_id=uid)
                    )
                # --- END DIFF LOGIC ---

    db.session.commit()
    return jsonify(tasklist.to_dict()), 200



@tasklist_routes.route("/<int:id>/complete-all", methods=["PUT"])
def complete_all_tasks(id):
    """
    Complete all tasks in a tasklist
    """
    tasklist = Tasklist.query.get_or_404(id)
    for task in tasklist.tasks:
        task.status = "completed"
    
    db.session.commit()

    return jsonify(tasklist.to_dict()), 200

@tasklist_routes.route("/<int:id>/incomplete-all", methods=["PUT"])
def incomplete_all_tasks(id):
    """
    Mark all tasks in a tasklist as incomplete 
    """
    tasklist = Tasklist.query.get_or_404(id)
    for task in tasklist.tasks:
        task.status = "in_progress"
    
    db.session.commit()

    return jsonify(tasklist.to_dict()), 200


@tasklist_routes.route("/<int:id>/assigned-members", methods=["PUT"])
def manage_assigned_members(id):
    tasklist = Tasklist.query.get_or_404(id)
    data = request.get_json() or {}

    new_member_ids = set(data.get("members", []))

    # Household safety check
    if not tasklist.household:
        return jsonify({"error": "Only household lists support assigned members"}), 400

    household_member_ids = {u.id for u in tasklist.household.members}

    # Validate incoming IDs
    invalid_ids = new_member_ids - household_member_ids
    if invalid_ids:
        return jsonify(
            {"error": "Members must belong to the household", "invalid": list(invalid_ids)},
            400,
        )

    # Clear existing links
    for link in tasklist.member_links[:]:
        db.session.delete(link)

    # Decide all_members FIRST
    if new_member_ids == household_member_ids:
        # Everyone selected → no links needed
        tasklist.all_members = True
    else:
        tasklist.all_members = False

        # Persist subset links
        for user_id in new_member_ids:
            db.session.add(
                TasklistMember(
                    list_id=tasklist.id,
                    user_id=user_id,
                )
            )

    db.session.commit()
    return jsonify(tasklist.to_dict()), 200
    