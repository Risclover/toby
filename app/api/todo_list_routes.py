# routes/todo_lists.py
from flask import Blueprint, jsonify, request
from app.models import TodoList, Todo, User, Household
from app.extensions import db
from flask_login import current_user, login_required

todo_list_routes = Blueprint("todo_lists", __name__)

# TABLE OF CONTENTS
# 1. get_todo_list: Retrieve tasklist by id
# 2. get_todo_lists: Get all of a scope's tasklists (user's or household's)
# 3. create_todo_list: Create todo list
# 4. add_todo: Add todo to todo list
# 5. complete_todo: Mark todo as "completed"
# 6. Mark todo as "in_progress"
# 7. Remove todo from list
# 8. Clear list by removing all todos
# 9. Delete tasklist
# 10. Reorder tasklist (drag and drop)
# 11. Duplicate tasklist
# 12. Archive tasklist 
# 13. Update tasklist settings
# 14. Mark all tasks in a tasklist as "completed"
# 15. Mark all tasks in a tasklist as "in_progress" (incompleted)
# 16. Manage a tasklist's assigned members

@todo_list_routes.route("/<int:id>", methods=["GET"])
def get_todo_list(id):
    """
    Get a specific todo list by id 
    """
    todo_list = TodoList.query.get_or_404(id)
    return jsonify(todo_list.to_dict()), 200

@todo_list_routes.route("/<int:id>", methods=["GET"])
@login_required
def get_todo_lists(id):
    """
    Get a specific user's or household's todo lists
    """
    scope = request.args.get("scope", "user")

    if scope == "user":
        lists = TodoList.query.filter_by(user_id=current_user.id).all()

    elif scope == "household":
        household_id = request.args.get("householdId", type=int)
        if not household_id:
            return jsonify({"error": "householdId required"}), 400

        # Optional but good: verify the household exists & the user belongs
        household = Household.query.get(household_id)
        if not household:
            return jsonify({"error": "Household not found"}), 404
        if not current_user.is_member_of(household):  # implement this helper
            return jsonify({"error": "Forbidden"}), 403

        lists = TodoList.query.filter_by(household_id=household_id).all()

    else:
        return jsonify({"error": "invalid scope"}), 400

    return jsonify([t.to_dict() for t in lists]), 200  # [] when empty


@todo_list_routes.route("", methods=["POST"])
def create_todo_list():
    """
    Create a new todo list 
    """
    data = request.get_json()

    todo_list = TodoList(
        title=data["title"],
        user_id=data.get("user_id"),
        household_id=data.get("household_id")
    )
    
    db.session.add(todo_list)
    
    household = Household.query.get(data.get("household_id"))
    household.todo_lists.append(todo_list)

    db.session.commit()

    return jsonify(todo_list.to_dict()), 201


@todo_list_routes.route("/<int:id>/todos", methods=["POST"])
def add_todo(id):
    """
    Add a todo to a specific todo list, appended to the end (by sort_index).
    """
    data = request.get_json() or {}
    TodoList.query.get_or_404(id)  # ensures list exists

    max_idx = (
        db.session.query(db.func.coalesce(db.func.max(Todo.sort_index), -1))
        .filter(Todo.list_id == id)
        .scalar()
    )

    todo = Todo(
        title=data["title"],
        creator_id=current_user.get_id(),
        description=data.get("description"),
        status=data.get("status", "pending"),
        is_important=data.get("isImportant", False), 
        due_date=data.get("due_date"),         # parse to date/datetime if needed
        assigned_to_id=data.get("assigned_to_id"),
        list_id=id,
        sort_index=max_idx + 1,
    )

    db.session.add(todo)
    db.session.commit()
    return jsonify(todo.to_dict()), 201

# @todo_list_routes.route("/<int:id>/todos/<int:todo_id>/completed", methods=["PUT"])
# def complete_todo(id, todo_id):
#     data = request.get_json()
#     todo = Todo.query.get(todo_id)

#     setattr(todo, "status", "completed")
#     db.session.commit()

#     return jsonify({"message": f""})

@todo_list_routes.route("/<int:list_id>/todos/<int:id>", methods=["DELETE"])
def delete_todo(list_id, id):
    """
    Remove a todo from a todo list
    """
    todo = Todo.query.filter_by(id=id, list_id=list_id).first_or_404()
    deleted_todo = todo.to_dict()

    db.session.delete(todo)
    db.session.commit()

    return jsonify(deleted_todo), 200


@todo_list_routes.route("/<int:list_id>/todos", methods=["DELETE"])
def clear_list(list_id):
    """
    Remove all todos from a list
    """
    Todo.query.filter_by(list_id=list_id).delete()
    db.session.commit()
    return jsonify({"message": f"All todos deleted from list {list_id}"}), 200


@todo_list_routes.route("/<int:id>", methods=["DELETE"])
def delete_list(id):
    """
    Delete a todo list
    """
    todo_list = TodoList.query.get_or_404(id)
    db.session.delete(todo_list)
    db.session.commit()
    return jsonify({"message": f"List {id} deleted"}), 200


@todo_list_routes.route("/<int:id>", methods=["PUT"])
def edit_todo_list(id):
    """
    Edit todo list's title
    """
    todo_list = TodoList.query.get(id)

    data = request.get_json()
    title = data["title"]
    todo_list.title = title

    db.session.commit()
    return jsonify(todo_list.to_dict()), 200

@todo_list_routes.route("/<int:list_id>/reorder", methods=['PATCH'])
def reorder_todos(list_id):
    data = request.get_json() or {} 
    ordered_ids = data.get("orderedIds")

    if not isinstance(ordered_ids, list) or not ordered_ids:
        return jsonify({ "error": "orderedIds (non-empty array) required"}), 400
    
    todos = Todo.query.filter(Todo.list_id == list_id).all()
    current_ids = {todo.id for todo in todos}
    requested_ids = set(ordered_ids)


    for idx, tid in enumerate(ordered_ids):
        (
            db.session.query(Todo)
                .filter(Todo.id == tid, Todo.list_id == list_id)
                .update({Todo.sort_index: idx}, synchronize_session=False)
        )
    
    db.session.commit()
    return("", 204)

@todo_list_routes.route("/<int:id>/duplicate", methods=["POST"])
@login_required
def duplicate_list(id):
    """
    Create an exact copy of an existing tasklist.
    """
    try:
        original_list = TodoList.query.get_or_404(id)
        
        # Permission check
        if current_user.id not in original_list.audience_user_ids():
            return jsonify({"error": "Access denied"}), 403
        
        new_list = original_list.duplicate()
        db.session.commit()
        
        return jsonify(new_list.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to duplicate list"}), 500

@todo_list_routes.route("/<int:id>/archive", methods=["PUT"])
def archive_list(id):
    """
    Archive the tasklist.
    """
    tasklist = TodoList.query.get(id)
    tasklist.is_archived = True
    db.session.commit()

    return jsonify(tasklist.to_dict())

@todo_list_routes.route("/<int:id>/settings", methods=["PUT"])
def update_list_settings(id):
    """
    Update tasklist's settings
    """
    tasklist = TodoList.query.get_or_404(id)
    data = request.get_json() or {}

    field_mapping = {
        "title": "title",
        "icon": "icon",
        "color": "color",
        "viewMode": "view_mode",
        "defaultSortOrder": "default_sort_order",
        "defaultFilters": "default_filters",
        "newItemPosition": "new_item_position",
        "autoHideWhenEmpty": "auto_hide_when_empty"
    }

    # Update only provided fields
    for json_key, model_attr in field_mapping.items():
        if json_key in data:
            setattr(tasklist, model_attr, data[json_key])

    db.session.commit()

    return jsonify(tasklist.to_dict()), 200

@todo_list_routes.route("/<int:id>/complete-all", methods=["PUT"])
def complete_all_tasks(id):
    """
    Complete all tasks in a tasklist
    """
    tasklist = TodoList.query.get_or_404(id)
    for task in tasklist.todos:
        task.status = "completed"
    
    db.session.commit()

    return jsonify(tasklist.to_dict()), 200

@todo_list_routes.route("/<int:id>/incomplete-all", methods=["PUT"])
def incomplete_all_tasks(id):
    """
    Mark all tasks in a tasklist as incomplete 
    """
    tasklist = TodoList.query.get_or_404(id)
    for task in tasklist.todos:
        task.status = "in_progress"
    
    db.session.commit()

    return jsonify(tasklist.to_dict()), 200


@todo_list_routes.route("/<int:id>/assigned-members", methods=["PUT"])
def manage_assigned_members(id):
    """
    Manage a tasklist's assigned members
    """
    tasklist = TodoList.query.get_or_404(id)
    data = request.get_json() or {}
    
    new_member_ids = data.get("members", [])
    
    # Clear all existing member links
    for link in tasklist.member_links[:]:
        db.session.delete(link)
    
    # Add new members
    for user_id in new_member_ids:
        user = User.query.get(user_id)
        if user:
            new_link = TodoListMember(
                list_id=tasklist.id,
                user_id=user_id
            )
            db.session.add(new_link)
    
    db.session.commit()
    
    return jsonify(tasklist.to_dict()), 200
    