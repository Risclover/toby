# routes/todo_lists.py
from flask import Blueprint, jsonify, request
from app.models import TodoList, Todo, User, Household
from app.extensions import db
from flask_login import current_user, login_required

todo_list_routes = Blueprint("todo_lists", __name__)

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
        description=data.get("description"),
        status=data.get("status", "pending"),
        priority=data.get("priority", "low"),  # or "normal" if that's your enum
        due_date=data.get("due_date"),         # parse to date/datetime if needed
        assigned_to_id=data.get("assigned_to_id"),
        list_id=id,
        sort_index=max_idx + 1,
    )

    db.session.add(todo)
    db.session.commit()
    return jsonify(todo.to_dict()), 201

@todo_list_routes.route("/<int:id>/todos/<int:todo_id>/completed", methods=["PUT"])
def complete_todo(id, todo_id):
    data = request.get_json()
    todo = Todo.query.get(todo_id)

    setattr(todo, "status", "completed")
    db.session.commit()

    return jsonify({"message": f""})

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

