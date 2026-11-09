from app.models import TasklistMember, User
from app.models.notification import Notification, NotificationEntity, NotificationType
from types import SimpleNamespace
import pytest

T = NotificationType   # short alias for the tests below

def assign(client, task, user):
    """Assign through the update endpoint."""
    return client.patch(f"/api/tasks/{task.id}", json={"assignedToId": user.id})   # MATCH


def create_task(client, tasklist, **extra):
    """Create through the add-task endpoint."""
    return client.post(                                                            # MATCH
        f"/api/tasklists/{tasklist.id}/tasks", json={"title": "Dishes", **extra}
    )


def assigned_rows(user):
    return Notification.query.filter_by(
        recipient_id=user.id, type=NotificationType.TASK_ASSIGNED
    ).all()

def unassign(client, task):
    """Remove the assignee through the update endpoint."""
    return client.patch(f"/api/tasks/{task.id}", json={"assignedToId": None})   # MATCH

def rows_of(user, type_):
    return Notification.query.filter_by(recipient_id=user.id, type=type_).all()

@pytest.fixture
def scene(make_user, make_tasklist, make_task):
    """alice made the task, bob is assigned to it, carol is a bystander."""
    alice = make_user("alice")
    bob = make_user("bob")
    carol = make_user("carol")
    tasklist = make_tasklist(alice)
    task = make_task(tasklist, alice, title="Dishes", assigned_to_id=bob.id)
    return SimpleNamespace(alice=alice, bob=bob, carol=carol, tasklist=tasklist, task=task)


def count(user, type_):
    return Notification.query.filter_by(recipient_id=user.id, type=type_).count()


def edit(client, task, **payload):
    return client.patch(f"/api/tasks/{task.id}", json=payload)                          # MATCH


def set_completed(client, task, completed):
    return client.put(f"/api/tasks/{task.id}/completed", json={"completed": completed})  # MATCH


def delete_via_task_route(client, task):
    return client.delete(f"/api/tasks/{task.id}")                                       # MATCH


def delete_via_list_route(client, task):
    return client.delete(f"/api/tasklists/{task.list_id}/tasks/{task.id}")              # MATCH


# ---- TASK_ASSIGNED ----

def test_assign_notifies_assignee(client, login, make_user, make_tasklist, make_task):
    """Assigning a task notifies the person it was assigned to"""
    alice = make_user("alice")
    bob = make_user("bob")
    task = make_task(make_tasklist(alice), alice)
    login(alice)

    response = assign(client, task, bob)

    assert response.status_code == 200
    rows = assigned_rows(bob)
    assert len(rows) == 1
    assert rows[0].actor_id == alice.id


def test_assign_stores_fields(client, login, household, make_user, make_tasklist, make_task):
    """The notification records the household, the task, and its title"""
    alice = make_user("alice")
    bob = make_user("bob")
    task = make_task(make_tasklist(alice), alice, title="Dishes")
    login(alice)

    assign(client, task, bob)

    row = assigned_rows(bob)[0]
    assert row.household_id == household.id
    assert row.entity_type == NotificationEntity.TASK
    assert row.entity_id == task.id
    assert row.entity_label == "Dishes"


def test_assign_self_is_silent(client, login, make_user, make_tasklist, make_task):
    """Assigning a task to yourself notifies no one"""
    alice = make_user("alice")
    task = make_task(make_tasklist(alice), alice)
    login(alice)

    assign(client, task, alice)

    assert Notification.query.count() == 0


def test_assign_unchanged_is_silent(client, login, make_user, make_tasklist, make_task):
    """Saving a task with the same assignee notifies no one"""
    alice = make_user("alice")
    bob = make_user("bob")
    task = make_task(make_tasklist(alice), alice, assigned_to_id=bob.id)
    login(alice)

    assign(client, task, bob)

    assert assigned_rows(bob) == []


def test_reassign_notifies_new_assignee_only(client, login, make_user, make_tasklist, make_task):
    """Reassigning a task notifies the new assignee, not the old one"""
    alice = make_user("alice")
    bob = make_user("bob")
    carol = make_user("carol")
    task = make_task(make_tasklist(alice), alice, assigned_to_id=bob.id)
    login(alice)

    assign(client, task, carol)

    assert len(assigned_rows(carol)) == 1
    assert assigned_rows(bob) == []


def test_assign_same_list_folds(client, login, make_user, make_tasklist, make_task):
    """Assigning several tasks from one list to the same person gives them one notification"""
    alice = make_user("alice")
    bob = make_user("bob")
    tasklist = make_tasklist(alice)
    dishes = make_task(tasklist, alice, title="Dishes")
    laundry = make_task(tasklist, alice, title="Laundry")
    login(alice)

    assign(client, dishes, bob)
    assign(client, laundry, bob)

    rows = assigned_rows(bob)
    assert len(rows) == 1
    assert rows[0].count == 2
    assert rows[0].entity_labels == ["Dishes", "Laundry"]


def test_assign_different_lists_do_not_fold(client, login, make_user, make_tasklist, make_task):
    """Tasks from different lists give separate notifications"""
    alice = make_user("alice")
    bob = make_user("bob")
    chores = make_task(make_tasklist(alice, title="Chores"), alice)
    work = make_task(make_tasklist(alice, title="Work"), alice)
    login(alice)

    assign(client, chores, bob)
    assign(client, work, bob)

    assert len(assigned_rows(bob)) == 2


def test_assign_outside_audience_rejected(client, login, db, make_user, make_tasklist, make_task):
    """Assigning a task to someone who cannot see its list is rejected and notifies no one"""
    alice = make_user("alice")
    outsider = make_user("outsider")
    outsider.household_id = None
    db.session.commit()
    task = make_task(make_tasklist(alice), alice)
    login(alice)

    response = assign(client, task, outsider)

    assert response.status_code == 400
    db.session.refresh(task)
    assert task.assigned_to_id is None
    assert Notification.query.count() == 0


def test_assign_non_member_of_restricted_list_rejected(client, login, db, make_user, make_tasklist, make_task):
    """A restricted list's tasks can only be assigned to its members"""
    alice = make_user("alice")
    bob = make_user("bob")      # a member of the list
    carol = make_user("carol")  # in the household, but not a member
    tasklist = make_tasklist(alice, all_members=False)
    db.session.add(TasklistMember(tasklist_id=tasklist.id, user_id=bob.id))
    db.session.commit()
    task = make_task(tasklist, alice)
    login(alice)

    response = assign(client, task, carol)

    assert response.status_code == 400
    assert Notification.query.count() == 0


def test_assign_member_of_restricted_list_allowed(client, login, db, make_user, make_tasklist, make_task):
    """A member of a restricted list can be assigned its tasks"""
    alice = make_user("alice")
    bob = make_user("bob")
    tasklist = make_tasklist(alice, all_members=False)
    db.session.add(TasklistMember(tasklist_id=tasklist.id, user_id=bob.id))
    db.session.commit()
    task = make_task(tasklist, alice)
    login(alice)

    response = assign(client, task, bob)

    assert response.status_code == 200
    assert len(assigned_rows(bob)) == 1


def test_create_with_assignee_notifies(client, login, make_user, make_tasklist):
    """Creating a task already assigned to someone notifies them"""
    alice = make_user("alice")
    bob = make_user("bob")
    tasklist = make_tasklist(alice)
    login(alice)

    response = create_task(client, tasklist, assigned_to_id=bob.id)

    assert response.status_code == 201
    rows = assigned_rows(bob)
    assert len(rows) == 1
    assert rows[0].actor_id == alice.id
    assert rows[0].entity_id == response.get_json()["id"]
    assert rows[0].entity_label == "Dishes"


def test_create_without_assignee_is_silent(client, login, make_user, make_tasklist):
    """Creating an unassigned task notifies no one"""
    alice = make_user("alice")
    login(alice)

    response = create_task(client, make_tasklist(alice))

    assert response.status_code == 201
    assert Notification.query.count() == 0


def test_create_outside_audience_rejected(client, login, db, make_user, make_tasklist):
    """Creating a task assigned to someone who cannot see the list is rejected"""
    alice = make_user("alice")
    outsider = make_user("outsider")
    outsider.household_id = None
    db.session.commit()
    login(alice)

    response = create_task(client, make_tasklist(alice), assigned_to_id=outsider.id)

    assert response.status_code == 400
    assert Notification.query.count() == 0


def test_create_requires_login(client, make_user, make_tasklist):
    """A logged-out request cannot create a task"""
    alice = make_user("alice")

    response = create_task(client, make_tasklist(alice))

    assert response.status_code == 401


# ---- TASK_UNASSIGNED ----

def test_unassign_notifies_old_assignee(client, login, make_user, make_tasklist, make_task):
    """Removing someone from a task notifies them"""
    alice = make_user("alice")
    bob = make_user("bob")
    task = make_task(make_tasklist(alice), alice, title="Dishes", assigned_to_id=bob.id)
    login(alice)

    response = unassign(client, task)

    assert response.status_code == 200
    rows = rows_of(bob, NotificationType.TASK_UNASSIGNED)
    assert len(rows) == 1
    assert rows[0].actor_id == alice.id
    assert rows[0].entity_type == NotificationEntity.TASK
    assert rows[0].entity_id == task.id
    assert rows[0].entity_label == "Dishes"


def test_unassign_sends_no_assigned_notification(client, login, make_user, make_tasklist, make_task):
    """Removing the assignee does not also send an assigned notification"""
    alice = make_user("alice")
    bob = make_user("bob")
    task = make_task(make_tasklist(alice), alice, assigned_to_id=bob.id)
    login(alice)

    unassign(client, task)

    assert Notification.query.filter_by(type=NotificationType.TASK_ASSIGNED).count() == 0


def test_reassign_notifies_old_and_new(client, login, make_user, make_tasklist, make_task):
    """Moving a task from one person to another tells both"""
    alice = make_user("alice")
    bob = make_user("bob")
    carol = make_user("carol")
    task = make_task(make_tasklist(alice), alice, assigned_to_id=bob.id)
    login(alice)

    assign(client, task, carol)

    assert len(rows_of(bob, NotificationType.TASK_UNASSIGNED)) == 1
    assert len(rows_of(carol, NotificationType.TASK_ASSIGNED)) == 1
    assert rows_of(bob, NotificationType.TASK_ASSIGNED) == []


def test_unassign_task_with_no_assignee_is_silent(client, login, make_user, make_tasklist, make_task):
    """Clearing the assignee of a task that has none notifies no one"""
    alice = make_user("alice")
    task = make_task(make_tasklist(alice), alice)
    login(alice)

    unassign(client, task)

    assert Notification.query.count() == 0


def test_unassign_same_list_folds(client, login, make_user, make_tasklist, make_task):
    """Removing someone from several tasks in one list gives them one notification"""
    alice = make_user("alice")
    bob = make_user("bob")
    tasklist = make_tasklist(alice)
    dishes = make_task(tasklist, alice, title="Dishes", assigned_to_id=bob.id)
    laundry = make_task(tasklist, alice, title="Laundry", assigned_to_id=bob.id)
    login(alice)

    unassign(client, dishes)
    unassign(client, laundry)

    rows = rows_of(bob, NotificationType.TASK_UNASSIGNED)
    assert len(rows) == 1
    assert rows[0].count == 2
    assert rows[0].entity_labels == ["Dishes", "Laundry"]


# ---- TASK_SELF_UNASSIGNED ----

def test_self_unassign_notifies_creator(client, login, make_user, make_tasklist, make_task):
    """When an assignee takes themselves off a task, its creator is told"""
    alice = make_user("alice")   # creator
    bob = make_user("bob")       # assignee
    task = make_task(make_tasklist(alice), alice, title="Dishes", assigned_to_id=bob.id)
    login(bob)

    response = unassign(client, task)

    assert response.status_code == 200
    rows = rows_of(alice, NotificationType.TASK_SELF_UNASSIGNED)
    assert len(rows) == 1
    assert rows[0].actor_id == bob.id
    assert rows[0].entity_id == task.id
    assert rows[0].entity_label == "Dishes"


def test_self_unassign_does_not_notify_self(client, login, make_user, make_tasklist, make_task):
    """The assignee who removes themselves gets no notification"""
    alice = make_user("alice")
    bob = make_user("bob")
    task = make_task(make_tasklist(alice), alice, assigned_to_id=bob.id)
    login(bob)

    unassign(client, task)

    assert Notification.query.filter_by(recipient_id=bob.id).count() == 0


def test_self_unassign_by_creator_is_silent(client, login, make_user, make_tasklist, make_task):
    """A creator who unassigns themselves from their own task notifies no one"""
    alice = make_user("alice")
    task = make_task(make_tasklist(alice), alice, assigned_to_id=alice.id)
    login(alice)

    unassign(client, task)

    assert Notification.query.count() == 0


def test_unassign_by_other_is_not_self_unassign(client, login, make_user, make_tasklist, make_task):
    """Someone else removing the assignee does not send the self-unassign notification"""
    alice = make_user("alice")
    bob = make_user("bob")
    task = make_task(make_tasklist(alice), alice, assigned_to_id=bob.id)
    login(alice)

    unassign(client, task)

    assert Notification.query.filter_by(type=NotificationType.TASK_SELF_UNASSIGNED).count() == 0


# ---- TASK_CHANGED ----

def test_change_notifies_assignee_and_creator(client, login, scene):
    """An edit by someone else tells both the assignee and the creator"""
    login(scene.carol)

    response = edit(client, scene.task, title="Dishes and pots")

    assert response.status_code == 200
    assert count(scene.alice, T.TASK_CHANGED) == 1
    assert count(scene.bob, T.TASK_CHANGED) == 1
    assert count(scene.carol, T.TASK_CHANGED) == 0


def test_change_by_assignee_notifies_creator_only(client, login, scene):
    """When the assignee edits, only the creator is told"""
    login(scene.bob)

    edit(client, scene.task, title="Dishes and pots")

    assert count(scene.alice, T.TASK_CHANGED) == 1
    assert count(scene.bob, T.TASK_CHANGED) == 0


def test_change_by_creator_notifies_assignee_only(client, login, scene):
    """When the creator edits, only the assignee is told"""
    login(scene.alice)

    edit(client, scene.task, title="Dishes and pots")

    assert count(scene.bob, T.TASK_CHANGED) == 1
    assert count(scene.alice, T.TASK_CHANGED) == 0


def test_change_unassigned_task_notifies_creator(client, login, scene, make_task):
    """An edit to a task nobody is assigned to still tells its creator"""
    task = make_task(scene.tasklist, scene.alice, title="Trash")
    login(scene.carol)

    edit(client, task, title="Trash and recycling")

    assert count(scene.alice, T.TASK_CHANGED) == 1


@pytest.mark.parametrize("payload", [
    {"title": "Dishes and pots"},
    {"description": "Use the blue sponge"},
    {"notes": "Soak first"},
    {"dueDate": "2026-12-01T00:00:00"},
])
def test_change_counts_content_fields(client, login, scene, payload):
    """Editing the title, description, notes or due date counts as a change"""
    login(scene.carol)

    edit(client, scene.task, **payload)

    assert count(scene.bob, T.TASK_CHANGED) == 1


@pytest.mark.parametrize("payload", [
    {"title": "Dishes"},              # same value as before
    {"isImportant": True},
    {"status": "in_progress"},
])
def test_change_ignores_other_edits(client, login, scene, payload):
    """Saving the same value, flipping importance, or changing status is not a change"""
    login(scene.carol)

    edit(client, scene.task, **payload)

    assert count(scene.bob, T.TASK_CHANGED) == 0
    assert count(scene.alice, T.TASK_CHANGED) == 0


def test_change_and_reassign_tells_each_person_once(client, login, scene):
    """Reassigning and editing at once: the new assignee hears assigned, the old one unassigned"""
    login(scene.alice)

    edit(client, scene.task, title="Dishes and pots", assignedToId=scene.carol.id)

    assert count(scene.carol, T.TASK_ASSIGNED) == 1
    assert count(scene.carol, T.TASK_CHANGED) == 0
    assert count(scene.bob, T.TASK_UNASSIGNED) == 1
    assert count(scene.bob, T.TASK_CHANGED) == 0


def test_repeated_edits_fold(client, login, scene):
    """Several edits of the same task in a row give one notification"""
    login(scene.carol)

    edit(client, scene.task, description="Use the blue sponge")
    edit(client, scene.task, description="Use the green sponge")

    assert count(scene.bob, T.TASK_CHANGED) == 1


# ---- TASK_DELETED ----

def test_delete_by_admin_notifies_assignee_and_creator(client, login, household, scene):
    """When the admin deletes a task, both its assignee and its creator are told"""
    login(User.query.get(household.admin_id))

    response = delete_via_task_route(client, scene.task)

    assert response.status_code == 200
    assert count(scene.alice, T.TASK_DELETED) == 1
    assert count(scene.bob, T.TASK_DELETED) == 1


def test_delete_by_creator_notifies_assignee_only(client, login, scene):
    """When the creator deletes a task, only the assignee is told"""
    login(scene.alice)

    delete_via_task_route(client, scene.task)

    assert count(scene.bob, T.TASK_DELETED) == 1
    assert count(scene.alice, T.TASK_DELETED) == 0


def test_delete_unassigned_task_notifies_creator(client, login, household, scene, make_task):
    """Deleting a task nobody is assigned to tells its creator"""
    task = make_task(scene.tasklist, scene.alice, title="Trash")
    login(User.query.get(household.admin_id))

    delete_via_task_route(client, task)

    assert count(scene.alice, T.TASK_DELETED) == 1


def test_delete_stores_fields(client, login, scene):
    """The notification keeps the task's id and title after the task is gone"""
    task_id = scene.task.id
    login(scene.alice)

    delete_via_task_route(client, scene.task)

    row = Notification.query.filter_by(recipient_id=scene.bob.id, type=T.TASK_DELETED).one()
    assert row.entity_type == NotificationEntity.TASK
    assert row.entity_id == task_id
    assert row.entity_label == "Dishes"


def test_delete_via_list_route_notifies(client, login, scene):
    """Deleting through the list endpoint tells the assignee too"""
    login(scene.alice)

    response = delete_via_list_route(client, scene.task)

    assert response.status_code == 200
    assert count(scene.bob, T.TASK_DELETED) == 1


def test_delete_forbidden_leaves_nothing(client, login, scene):
    """A refused delete notifies no one"""
    login(scene.bob)      # neither the creator nor the admin

    response = delete_via_task_route(client, scene.task)

    assert response.status_code == 403
    assert Notification.query.count() == 0


def test_clear_list_notifies_and_folds(client, login, scene, make_task):
    """Clearing a list tells the assignee once, not once per task"""
    make_task(scene.tasklist, scene.alice, title="Laundry", assigned_to_id=scene.bob.id)
    login(scene.alice)

    response = client.delete(f"/api/tasklists/{scene.tasklist.id}/tasks")      # MATCH

    assert response.status_code == 200
    rows = Notification.query.filter_by(recipient_id=scene.bob.id, type=T.TASK_DELETED).all()
    assert len(rows) == 1
    assert rows[0].count == 2



# ---- TASK_COMPLETED / TASK_REOPENED ----

def test_complete_notifies_assignee(client, login, scene):
    """Someone else completing your task tells you"""
    login(scene.carol)

    response = set_completed(client, scene.task, True)

    assert response.status_code == 200
    rows = Notification.query.filter_by(recipient_id=scene.bob.id, type=T.TASK_COMPLETED).all()
    assert len(rows) == 1
    assert rows[0].actor_id == scene.carol.id


def test_complete_own_task_is_silent(client, login, scene):
    """Completing your own task notifies no one"""
    login(scene.bob)

    set_completed(client, scene.task, True)

    assert Notification.query.count() == 0


def test_complete_unassigned_task_is_silent(client, login, scene, make_task):
    """Completing a task nobody is assigned to notifies no one"""
    task = make_task(scene.tasklist, scene.alice, title="Trash")
    login(scene.carol)

    set_completed(client, task, True)

    assert Notification.query.count() == 0


def test_complete_already_completed_is_silent(client, login, scene, make_task):
    """Completing a task that is already completed notifies no one"""
    task = make_task(scene.tasklist, scene.alice, title="Trash",
                     assigned_to_id=scene.bob.id, status="completed")
    login(scene.carol)

    set_completed(client, task, True)

    assert Notification.query.count() == 0


def test_complete_by_status_value_notifies(client, login, scene):
    """Completing with a status value works the same as with the boolean"""
    login(scene.carol)

    client.put(f"/api/tasks/{scene.task.id}/completed", json={"status": "completed"})   # MATCH

    assert count(scene.bob, T.TASK_COMPLETED) == 1


def test_complete_through_update_task_notifies(client, login, scene):
    """Setting the status through the general update endpoint also notifies"""
    login(scene.carol)

    edit(client, scene.task, status="completed")

    assert count(scene.bob, T.TASK_COMPLETED) == 1


def test_reopen_notifies_assignee(client, login, scene, make_task):
    """Someone else reopening your completed task tells you"""
    task = make_task(scene.tasklist, scene.alice, title="Trash",
                     assigned_to_id=scene.bob.id, status="completed")
    login(scene.carol)

    set_completed(client, task, False)

    assert count(scene.bob, T.TASK_REOPENED) == 1


def test_reopen_task_that_was_not_completed_is_silent(client, login, scene):
    """Marking an open task as not completed notifies no one"""
    login(scene.carol)

    set_completed(client, scene.task, False)

    assert Notification.query.count() == 0


def test_complete_all_notifies_and_folds(client, login, scene, make_task):
    """Completing a whole list tells the assignee once, and skips tasks already done"""
    make_task(scene.tasklist, scene.alice, title="Laundry",
              assigned_to_id=scene.bob.id, status="pending")
    make_task(scene.tasklist, scene.alice, title="Done already",
              assigned_to_id=scene.bob.id, status="completed")
    login(scene.alice)

    response = client.put(f"/api/tasklists/{scene.tasklist.id}/complete-all")          # MATCH

    assert response.status_code == 200
    rows = Notification.query.filter_by(recipient_id=scene.bob.id, type=T.TASK_COMPLETED).all()
    assert len(rows) == 1
    assert rows[0].count == 2
    assert set(rows[0].entity_labels) == {"Dishes", "Laundry"}


def test_incomplete_all_reopens_and_folds(client, login, scene, make_task):
    """Reopening a whole list tells the assignee once, and skips tasks that were never completed"""
    scene.task.status = "completed"
    make_task(scene.tasklist, scene.alice, title="Laundry",
              assigned_to_id=scene.bob.id, status="completed")
    make_task(scene.tasklist, scene.alice, title="Never done",
              assigned_to_id=scene.bob.id, status="pending")
    login(scene.alice)

    response = client.put(f"/api/tasklists/{scene.tasklist.id}/incomplete-all")        # MATCH

    assert response.status_code == 200
    rows = Notification.query.filter_by(recipient_id=scene.bob.id, type=T.TASK_REOPENED).all()
    assert len(rows) == 1
    assert rows[0].count == 2