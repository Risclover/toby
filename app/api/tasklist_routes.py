from flask import Blueprint, jsonify, request
from app.models import Tasklist, Task, User, Household, TasklistMember, FeaturedListSetting
from app.extensions import db
from flask_login import current_user, login_required
from app.models.tasklist import SortOrder
from app.utils.reminder_utils import create_task_due_reminders
from app.utils.activity_service import ActivityService
import pytz
from datetime import datetime, date

tasklist_routes = Blueprint("tasklists", __name__)

def is_household_admin(household_id):
    household = Household.query.get(household_id)
    return household and current_user.id == household.admin_id

def get_tasklist_audience_ids(tasklist):
    """None = household-wide. List = restricted to creator + assigned members."""
    if tasklist.all_members:
        return None
    audience = {tasklist.creator_id}
    for link in tasklist.member_links:
        audience.add(link.user_id)
    return list(audience)

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
    tasklist = Tasklist.query.get_or_404(id)
    return jsonify(tasklist.to_dict()), 200

@tasklist_routes.route("/<int:id>", methods=["GET"])
@login_required
def get_tasklists(id):
    scope = request.args.get("scope", "user")

    if scope == "user":
        lists = Tasklist.query.filter_by(creator_id=current_user.id).all()

    elif scope == "household":
        only_archived_lists = request.args.get("archived") == "true"
        household_id = request.args.get("householdId", type=int)
        if not household_id:
            return jsonify({"error": "householdId required"}), 400

        household = Household.query.get(household_id)
        if not household:
            return jsonify({"error": "Household not found"}), 404
        if not current_user.is_member_of(household):
            return jsonify({"error": "Forbidden"}), 403

        if only_archived_lists:
            lists = Tasklist.query.filter_by(household_id=household_id, is_archived=True).all()
        else:
            lists = Tasklist.query.filter_by(household_id=household_id, is_archived=False).all()

    else:
        return jsonify({"error": "invalid scope"}), 400

    user_lists = []
    for tasklist in lists:
        if tasklist.creator_id == current_user.id:
            user_lists.append(tasklist)
            continue

        if tasklist.household_id and current_user.is_member_of(household):
            is_assigned = TasklistMember.query.filter_by(
                tasklist_id=tasklist.id,
                user_id=current_user.id
            ).first() is not None

            if tasklist.all_members or is_assigned:
                user_lists.append(tasklist)

    return jsonify([t.to_dict() for t in user_lists]), 200


@tasklist_routes.route("", methods=["POST"])
def create_tasklist():
    data = request.get_json()

    tasklist = Tasklist(
        title=data["title"],
        color=data["color"],
        creator_id=data.get("creator_id", current_user.id),
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

    due_date_utc = None
    timezone_str = data.get("timezone") or current_user.timezone or "UTC"
    user_tz = pytz.timezone(timezone_str)

    if data.get("due_date"):
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
    db.session.flush()

    create_task_due_reminders(task)

    ActivityService.record(
        household_id=tasklist.household_id,
        actor_id=current_user.id,
        action="created",
        entity_type="task",
        entity_id=task.id,
        entity_label=task.title,
        event_metadata={"listId": tasklist.id, "listTitle": tasklist.title},
        audience_ids=get_tasklist_audience_ids(tasklist),
    )

    db.session.commit()
    return jsonify(task.to_dict()), 201


@tasklist_routes.route("/<int:list_id>/tasks/<int:id>", methods=["DELETE"])
@login_required
def delete_task(list_id, id):
    task = Task.query.filter_by(id=id, list_id=list_id).first_or_404()
    tasklist = Tasklist.query.get(list_id)

    # Creator or admin can delete
    if current_user.id != task.creator_id and not is_household_admin(tasklist.household_id):
        return jsonify({"error": "Forbidden"}), 403

    deleted_task = task.to_dict()

    ActivityService.record(
        household_id=tasklist.household_id,
        actor_id=current_user.id,
        action="deleted",
        entity_type="task",
        entity_id=task.id,
        entity_label=task.title,
        event_metadata={"listId": list_id, "listTitle": tasklist.title},
        audience_ids=get_tasklist_audience_ids(tasklist),
    )

    db.session.delete(task)
    db.session.commit()
    return jsonify(deleted_task), 200


@tasklist_routes.route("/<int:list_id>/tasks", methods=["DELETE"])
@login_required
def clear_list(list_id):
    tasklist = Tasklist.query.get_or_404(list_id)

    # Creator or admin can clear
    if current_user.id != tasklist.creator_id and not is_household_admin(tasklist.household_id):
        return jsonify({"error": "Forbidden"}), 403

    Task.query.filter_by(list_id=list_id).delete()
    db.session.commit()
    return jsonify({"message": f"All tasks deleted from list {list_id}"}), 200


@tasklist_routes.route("/<int:id>", methods=["DELETE"])
@login_required
def delete_list(id):
    tasklist = Tasklist.query.get_or_404(id)

    # Creator or admin can delete
    if current_user.id != tasklist.creator_id and not is_household_admin(tasklist.household_id):
        return jsonify({"error": "Forbidden"}), 403

    FeaturedListSetting.query.filter(FeaturedListSetting.tasklist_id == id).update(
        {FeaturedListSetting.tasklist_id: None},
        synchronize_session=False
    )

    ActivityService.record(
        household_id=tasklist.household_id,
        actor_id=current_user.id,
        action="deleted",
        entity_type="tasklist",
        entity_id=tasklist.id,
        entity_label=tasklist.title,
        audience_ids=get_tasklist_audience_ids(tasklist),
    )

    db.session.delete(tasklist)
    db.session.commit()
    return jsonify({"message": f"List {id} deleted"}), 200


@tasklist_routes.route("/<int:id>", methods=["PUT"])
@login_required
def edit_tasklist(id):
    tasklist = Tasklist.query.get_or_404(id)

    # Creator or admin can edit
    if current_user.id != tasklist.creator_id and not is_household_admin(tasklist.household_id):
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json()
    old_title = tasklist.title
    title = data["title"]
    tasklist.title = title

    ActivityService.record(
        household_id=tasklist.household_id,
        actor_id=current_user.id,
        action="renamed",
        entity_type="tasklist",
        entity_id=tasklist.id,
        entity_label=title,
        event_metadata={"oldTitle": old_title},
        audience_ids=get_tasklist_audience_ids(tasklist),
    )

    db.session.commit()
    return jsonify(tasklist.to_dict()), 200

@tasklist_routes.route("/<int:list_id>/reorder", methods=['PATCH'])
@login_required
def reorder_tasks(list_id):
    tasklist = Tasklist.query.get_or_404(list_id)

    # Creator or admin can reorder
    if current_user.id != tasklist.creator_id and not is_household_admin(tasklist.household_id):
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json() or {}
    ordered_ids = data.get("orderedIds")
    set_to_manual = data.get("setToManual", False)

    if tasklist.default_sort_order != SortOrder.MANUAL.value and not set_to_manual:
        return jsonify({"error": "Manual reordering is disabled unless sort order is set to 'manual'."}), 400

    if not isinstance(ordered_ids, list) or not ordered_ids:
        return jsonify({"error": "orderedIds (non-empty array) required"}), 400

    for idx, tid in enumerate(ordered_ids):
        (
            db.session.query(Task)
                .filter(Task.id == tid, Task.list_id == list_id)
                .update({Task.sort_index: idx}, synchronize_session=False)
        )

    if set_to_manual:
        tasklist.default_sort_order = SortOrder.MANUAL.value

    db.session.commit()
    return jsonify(tasklist.to_dict()), 200

@tasklist_routes.route("/<int:id>/duplicate", methods=["POST"])
@login_required
def duplicate_list(id):
    try:
        original_list = Tasklist.query.get_or_404(id)

        # Admin bypasses audience check
        if not is_household_admin(original_list.household_id):
            if current_user.id not in original_list.audience_user_ids():
                return jsonify({"error": "Access denied"}), 403

        new_list = original_list.duplicate()
        db.session.flush()

        ActivityService.record(
            household_id=new_list.household_id,
            actor_id=current_user.id,
            action="created",
            entity_type="tasklist",
            entity_id=new_list.id,
            entity_label=new_list.title,
            event_metadata={"duplicatedFrom": original_list.title},
            audience_ids=get_tasklist_audience_ids(new_list),
        )

        db.session.commit()
        return jsonify(new_list.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to duplicate list"}), 500

@tasklist_routes.route("/<int:id>/archive", methods=["PUT"])
@login_required
def archive_list(id):
    tasklist = Tasklist.query.get_or_404(id)

    # Creator or admin can archive
    if current_user.id != tasklist.creator_id and not is_household_admin(tasklist.household_id):
        return jsonify({"error": "Forbidden"}), 403

    tasklist.is_archived = True
    tasklist.archived_by = current_user.id

    ActivityService.record(
        household_id=tasklist.household_id,
        actor_id=current_user.id,
        action="archived",
        entity_type="tasklist",
        entity_id=tasklist.id,
        entity_label=tasklist.title,
        audience_ids=get_tasklist_audience_ids(tasklist),
    )

    db.session.commit()
    return jsonify(tasklist.to_dict())

@tasklist_routes.route("/<int:id>/unarchive", methods=["PUT"])
@login_required
def unarchive_list(id):
    tasklist = Tasklist.query.get_or_404(id)

    # Creator or admin can unarchive
    if current_user.id != tasklist.creator_id and not is_household_admin(tasklist.household_id):
        return jsonify({"error": "Forbidden"}), 403

    tasklist.is_archived = False

    ActivityService.record(
        household_id=tasklist.household_id,
        actor_id=current_user.id,
        action="unarchived",
        entity_type="tasklist",
        entity_id=tasklist.id,
        entity_label=tasklist.title,
        audience_ids=get_tasklist_audience_ids(tasklist),
    )

    db.session.add(tasklist)
    db.session.commit()
    db.session.refresh(tasklist)
    return jsonify(tasklist.to_dict())

@tasklist_routes.route("/<int:id>/settings", methods=["PUT"])
@login_required
def update_list_settings(id):
    tasklist = Tasklist.query.get_or_404(id)

    # Creator or admin can update settings
    if current_user.id != tasklist.creator_id and not is_household_admin(tasklist.household_id):
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json() or {}
    old_title = tasklist.title

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

    if "title" in data and data["title"] != old_title:
        ActivityService.record(
            household_id=tasklist.household_id,
            actor_id=current_user.id,
            action="renamed",
            entity_type="tasklist",
            entity_id=tasklist.id,
            entity_label=tasklist.title,
            event_metadata={"oldTitle": old_title},
            audience_ids=get_tasklist_audience_ids(tasklist),
        )

    if "memberIds" in data:
        new_member_ids = set(data["memberIds"])

        if tasklist.household:
            household_member_ids = {u.id for u in tasklist.household.members}

            invalid_ids = new_member_ids - household_member_ids
            if invalid_ids:
                return jsonify({
                    "error": "Members must belong to the household",
                    "invalid": list(invalid_ids)
                }), 400

            if new_member_ids == household_member_ids:
                tasklist.all_members = True
                for link in tasklist.member_links[:]:
                    db.session.delete(link)
            else:
                tasklist.all_members = False

                current_links = {link.user_id: link for link in tasklist.member_links}
                current_ids = set(current_links.keys())

                ids_to_add = new_member_ids - current_ids
                ids_to_remove = current_ids - new_member_ids

                for uid in ids_to_remove:
                    db.session.delete(current_links[uid])

                for uid in ids_to_add:
                    db.session.add(TasklistMember(tasklist_id=tasklist.id, user_id=uid))

    db.session.commit()
    return jsonify(tasklist.to_dict()), 200


@tasklist_routes.route("/<int:id>/complete-all", methods=["PUT"])
@login_required
def complete_all_tasks(id):
    tasklist = Tasklist.query.get_or_404(id)

    # Creator or admin can bulk complete
    if current_user.id != tasklist.creator_id and not is_household_admin(tasklist.household_id):
        return jsonify({"error": "Forbidden"}), 403

    for task in tasklist.tasks:
        task.status = "completed"

    db.session.commit()
    return jsonify(tasklist.to_dict()), 200

@tasklist_routes.route("/<int:id>/incomplete-all", methods=["PUT"])
@login_required
def incomplete_all_tasks(id):
    tasklist = Tasklist.query.get_or_404(id)

    # Creator or admin can bulk incomplete
    if current_user.id != tasklist.creator_id and not is_household_admin(tasklist.household_id):
        return jsonify({"error": "Forbidden"}), 403

    for task in tasklist.tasks:
        task.status = "in_progress"

    db.session.commit()
    return jsonify(tasklist.to_dict()), 200


@tasklist_routes.route("/<int:id>/assigned-members", methods=["PUT"])
@login_required
def manage_assigned_members(id):
    tasklist = Tasklist.query.get_or_404(id)

    # Creator or admin can manage members
    if current_user.id != tasklist.creator_id and not is_household_admin(tasklist.household_id):
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json() or {}
    new_member_ids = set(data.get("members", []))

    if not tasklist.household:
        return jsonify({"error": "Only household lists support assigned members"}), 400

    household_member_ids = {u.id for u in tasklist.household.members}

    invalid_ids = new_member_ids - household_member_ids
    if invalid_ids:
        return jsonify(
            {"error": "Members must belong to the household", "invalid": list(invalid_ids)}), 400

    for link in tasklist.member_links[:]:
        db.session.delete(link)

    if new_member_ids == household_member_ids:
        tasklist.all_members = True
    else:
        tasklist.all_members = False
        for user_id in new_member_ids:
            db.session.add(TasklistMember(tasklist_id=tasklist.id, user_id=user_id))

    db.session.commit()
    return jsonify(tasklist.to_dict()), 200
