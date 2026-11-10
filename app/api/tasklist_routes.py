from flask import Blueprint, jsonify, request
from app.models import Tasklist, Task, User, Household, TasklistMember, FeaturedListSetting
from app.extensions import db
from flask_login import current_user, login_required
from app.models.tasklist import SortOrder
from app.utils.reminder_utils import create_task_due_reminders
from app.services import ActivityService
from app.services.notification_triggers import (
    notify_task_assigned,
    notify_task_deleted,
    notify_task_status_changed,
    tasklist_access_ids,
    notify_tasklist_access_changed,
    notify_tasklist_self_unassigned,
    notify_tasklist_changed,
    notify_tasklist_deleted,
)
import pytz
from datetime import datetime, date

tasklist_routes = Blueprint("tasklists", __name__)

def is_household_admin(household_id):
    household = Household.query.get(household_id)
    return household and current_user.id == household.admin_id

def get_tasklist_audience_ids(tasklist):
    """
    None = household-wide. 
    List = restricted to creator + assigned members.
    """    
    if tasklist.all_members:
        return None
    audience = {tasklist.creator_id}
    for link in tasklist.member_links:
        audience.add(link.user_id)
    return list(audience)

def user_can_access_tasklist(tasklist, user_id):
    audience = get_tasklist_audience_ids(tasklist)
    if audience is None:
        user = User.query.get(user_id)
        return user is not None and user.household_id == tasklist.household_id
    return user_id in audience

def clear_featured_list(tasklist_id, user_ids):
    """Unfeature this list for users who can no longer see it."""
    if not user_ids:
        return
    FeaturedListSetting.query.filter(
        FeaturedListSetting.tasklist_id == tasklist_id,
        FeaturedListSetting.user_id.in_(user_ids),
    ).update({FeaturedListSetting.tasklist_id: None}, synchronize_session=False)

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


@tasklist_routes.route("/<int:id>/tasks", methods=["POST"])
@login_required
def add_task(id):
    data = request.get_json() or {}
    tasklist = Tasklist.query.get_or_404(id)

    assigned_to_id = data.get("assigned_to_id")
    if assigned_to_id is not None and not user_can_access_tasklist(tasklist, assigned_to_id):
        return jsonify({"error": "Assignee cannot access this list"}), 400

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
        assigned_to_id=assigned_to_id,
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
        batch_key=f"task-created-{tasklist.id}",
    )

    notify_task_assigned(task, current_user)

    db.session.commit()
    return jsonify(task.to_dict()), 201


@tasklist_routes.route("/<int:list_id>/tasks/<int:id>", methods=["DELETE"])
@login_required
def delete_task(list_id, id):
    task = Task.query.filter_by(id=id, list_id=list_id).first_or_404()
    tasklist = Tasklist.query.get(list_id)

    # Creator or admin can delete
    if not tasklist.can_manage(current_user):
        return jsonify({"error": "Forbidden"}), 403

    deleted_task = task.to_dict()

    ActivityService.record(
        household_id=tasklist.household_id,
        actor_id=current_user.id,
        action="deleted",
        entity_type="task",
        entity_id=task.id,
        entity_label=task.title,
        event_metadata={"listId": tasklist.id, "listTitle": tasklist.title},
        audience_ids=get_tasklist_audience_ids(tasklist),
        batch_key=f"task-deleted-{tasklist.id}",
    )

    notify_task_deleted(task, current_user)

    db.session.delete(task)
    db.session.commit()
    return jsonify(deleted_task), 200


@tasklist_routes.route("/<int:list_id>/tasks", methods=["DELETE"])
@login_required
def clear_list(list_id):
    tasklist = Tasklist.query.get_or_404(list_id)

    # Creator or admin can clear
    if not tasklist.can_manage(current_user):
        return jsonify({"error": "Forbidden"}), 403

    # Notify first: the bulk delete below skips the ORM, so the tasks must be read now.
    # The batch key folds these into one notification per person.
    for task in Task.query.filter_by(list_id=list_id).all():
        notify_task_deleted(task, current_user)

    Task.query.filter_by(list_id=list_id).delete()
    db.session.commit()
    return jsonify({"message": f"All tasks deleted from list {list_id}"}), 200


@tasklist_routes.route("/<int:id>", methods=["DELETE"])
@login_required
def delete_list(id):
    tasklist = Tasklist.query.get_or_404(id)

    # Creator or admin can delete
    if not tasklist.can_manage(current_user):
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

    notify_tasklist_deleted(tasklist, current_user)

    db.session.delete(tasklist)
    db.session.commit()
    return jsonify({"message": f"List {id} deleted"}), 200


@tasklist_routes.route("/<int:id>", methods=["PUT"])
@login_required
def edit_tasklist(id):
    tasklist = Tasklist.query.get_or_404(id)

    # Creator or admin can edit
    if not tasklist.can_manage(current_user):
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json()
    old_title = tasklist.title
    before_ids = tasklist_access_ids(tasklist)
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

    if title != old_title:
        notify_tasklist_changed(tasklist, before_ids, current_user)

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
        if not original_list.has_access(current_user):
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

        # duplicate() copies the member links by id, so read them from the original.
        if not new_list.all_members:
            copied_ids = {link.user_id for link in original_list.member_links}
            notify_tasklist_access_changed(new_list, set(), copied_ids, current_user)

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
    if not tasklist.can_manage(current_user):
        return jsonify({"error": "Forbidden"}), 403

    tasklist.is_archived = True
    tasklist.archived_by = current_user.id
    tasklist.archived_date = datetime.utcnow()

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
    if not tasklist.can_manage(current_user):
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
    if not tasklist.can_manage(current_user):
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json() or {}
    old_title = tasklist.title
    before_ids = tasklist_access_ids(tasklist)
    after_ids = None   # stays None unless the members change

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

    title_changed = "title" in data and data["title"] != old_title
    if title_changed:
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
                after_ids = household_member_ids | {tasklist.creator_id}
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

                after_ids = new_member_ids | {tasklist.creator_id}

    if title_changed:
        kept_ids = before_ids if after_ids is None else before_ids & after_ids
        notify_tasklist_changed(tasklist, kept_ids, current_user)
    if after_ids is not None:
        notify_tasklist_access_changed(tasklist, before_ids, after_ids, current_user)

    db.session.commit()
    return jsonify(tasklist.to_dict()), 200


@tasklist_routes.route("/<int:id>/complete-all", methods=["PUT"])
@login_required
def complete_all_tasks(id):
    tasklist = Tasklist.query.get_or_404(id)

    # Creator or admin can bulk complete
    if not tasklist.can_manage(current_user):
        return jsonify({"error": "Forbidden"}), 403

    for task in tasklist.tasks:
        old_status = task.status
        task.status = "completed"
        notify_task_status_changed(task, old_status, current_user)

    ActivityService.record(
        household_id=tasklist.household_id,
        actor_id=current_user.id,
        action="completed",
        entity_type="tasklist",
        entity_id=tasklist.id,
        entity_label=tasklist.title,
        audience_ids=get_tasklist_audience_ids(tasklist),
    )

    db.session.commit()
    return jsonify(tasklist.to_dict()), 200

@tasklist_routes.route("/<int:id>/incomplete-all", methods=["PUT"])
@login_required
def incomplete_all_tasks(id):
    tasklist = Tasklist.query.get_or_404(id)

    # Creator or admin can bulk incomplete
    if not tasklist.can_manage(current_user):
        return jsonify({"error": "Forbidden"}), 403

    for task in tasklist.tasks:
        old_status = task.status
        task.status = "in_progress"
        notify_task_status_changed(task, old_status, current_user)

    ActivityService.record(
        household_id=tasklist.household_id,
        actor_id=current_user.id,
        action="uncompleted",
        entity_type="tasklist",
        entity_id=tasklist.id,
        entity_label=tasklist.title,
        audience_ids=get_tasklist_audience_ids(tasklist),
    )

    db.session.commit()
    return jsonify(tasklist.to_dict()), 200


@tasklist_routes.route("/<int:id>/assigned-members", methods=["PUT"])
@login_required
def manage_assigned_members(id):
    tasklist = Tasklist.query.get_or_404(id)

    # Creator or admin can manage members
    if not tasklist.can_manage(current_user):
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

    before_ids = tasklist_access_ids(tasklist)

    for link in tasklist.member_links[:]:
        db.session.delete(link)

    if new_member_ids == household_member_ids:
        tasklist.all_members = True
        after_ids = household_member_ids | {tasklist.creator_id}
    else:
        tasklist.all_members = False
        for user_id in new_member_ids:
            db.session.add(TasklistMember(tasklist_id=tasklist.id, user_id=user_id))
        after_ids = new_member_ids | {tasklist.creator_id}

    clear_featured_list(tasklist.id, before_ids - after_ids)
    notify_tasklist_access_changed(tasklist, before_ids, after_ids, current_user)

    db.session.commit()
    return jsonify(tasklist.to_dict()), 200


@tasklist_routes.route("/<int:id>/leave", methods=["POST"])
@login_required
def leave_list(id):
    """A member takes themselves off a restricted list. The creator is told."""
    tasklist = Tasklist.query.get_or_404(id)

    if tasklist.all_members:
        return jsonify({"error": "Everyone in the household has access to this list"}), 400
    if current_user.id == tasklist.creator_id:
        return jsonify({"error": "You can't leave a list you created"}), 400

    link = TasklistMember.query.filter_by(
        tasklist_id=tasklist.id, user_id=current_user.id
    ).first()
    if link is None:
        return jsonify({"error": "You are not a member of this list"}), 404

    db.session.delete(link)
    clear_featured_list(tasklist.id, {current_user.id})
    notify_tasklist_self_unassigned(tasklist, current_user)

    db.session.commit()
    return jsonify({"message": f"Left list {id}"}), 200