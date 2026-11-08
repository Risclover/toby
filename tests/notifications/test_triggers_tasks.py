from app.models import TasklistMember
from app.models.notification import Notification, NotificationEntity, NotificationType


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


# --- TASK_ASSIGNED via update ------------------------------------------------

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


# --- Who can be assigned ------------------------------------------------------

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


# --- TASK_ASSIGNED via create -------------------------------------------------

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