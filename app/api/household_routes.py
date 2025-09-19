from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.extensions import db
from app.models import Household, TodoList, TodoListMember


household_routes = Blueprint('households', __name__)

@household_routes.route("/<int:id>")
def get_household(id):
    household = Household.query.get(id)

    return jsonify(household.to_dict())

@household_routes.route("/<int:household_id>/todo_lists", methods=["GET"])
@login_required
def get_household_todo_lists(household_id):
    household = Household.query.get(household_id)

    if not household:
        return jsonify({"error": "Household not found"}), 404

    lists = household.todo_lists

    return jsonify([t.to_dict() for t in lists]), 200

@household_routes.route("/<int:household_id>/todo_lists", methods=["POST"])
def create_household_todo_list(household_id):
    # 1) Household must exist
    household = Household.query.get(household_id)
    if not household:
        return jsonify({"error": "Household not found"}), 404

    # 2) Must be a member (tweak if you support multi-household users)
    if current_user.household_id != household_id:
        return jsonify({"error": "Forbidden"}), 403

    # 3) Validate payload
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "Title is required"}), 400

    all_members = bool(data.get("allMembers"))
    member_ids = data.get("memberIds") or []

    if not all_members:
        if not isinstance(member_ids, list) or len(member_ids) == 0:
            return jsonify({"error": "memberIds (non-empty) required when allMembers is false"}), 400
        valid_ids = {u.id for u in household.members or []}
        bad = [uid for uid in set(member_ids) if uid not in valid_ids]
        if bad:
            return jsonify({"error": "memberIds must belong to the household", "invalid": bad}), 400

    # 4) Create list + (optional) audience rows
    tl = TodoList(title=title, household_id=household_id, all_members=all_members)
    db.session.add(tl)
    db.session.flush()  # get tl.id now

    if not all_members:
        links = [TodoListMember(todo_list_id=tl.id, user_id=uid) for uid in set(member_ids)]
        db.session.add_all(links)

    db.session.commit()
    return jsonify(tl.to_dict(include_todos=False, include_members=True)), 201