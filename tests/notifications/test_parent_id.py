from app.models import Notification, NotificationEntity, NotificationType
from app.services.notification_service import NotificationService
from app.services.notification_triggers import notify_task_assigned, notify_tasklist_deleted


def send(household, recipient, actor, **overrides):
    """One TASK_ASSIGNED through the service, with overridable fields."""
    fields = dict(
        type=NotificationType.TASK_ASSIGNED,
        household_id=household.id,
        recipient_ids=[recipient.id],
        actor_id=actor.id,
        entity_type=NotificationEntity.TASK,
        entity_id=1,
        entity_label="Dishes",
        batch_key="task-assigned-7",
        parent_id=7,
    )
    fields.update(overrides)
    return NotificationService.notify(**fields)


# ---- SERVICE ----

def test_notify_stores_parent(db, household, admin, make_user):
    """The parent id is saved on the row and sent to the frontend as parentId."""
    bob = make_user("bob")

    send(household, bob, admin)
    db.session.commit()

    row = Notification.query.one()
    assert row.parent_id == 7
    assert row.to_dict()["parentId"] == 7


def test_parent_defaults_to_none(db, household, admin, make_user):
    """Callers that don't pass a parent get None, not an error."""
    bob = make_user("bob")

    NotificationService.notify(
        type=NotificationType.MEMBER_JOINED,
        household_id=household.id,
        recipient_ids=[bob.id],
        actor_id=admin.id,
    )
    db.session.commit()

    row = Notification.query.one()
    assert row.parent_id is None
    assert row.to_dict()["parentId"] is None


def test_fold_keeps_shared_parent(db, household, admin, make_user):
    """Two tasks from the same list fold: the entity id is dropped, the parent stays."""
    bob = make_user("bob")

    send(household, bob, admin, entity_id=1, entity_label="Dishes")
    db.session.commit()
    send(household, bob, admin, entity_id=2, entity_label="Laundry")
    db.session.commit()

    row = Notification.query.one()
    assert row.count == 2
    assert row.entity_id is None
    assert row.parent_id == 7


def test_fold_drops_mixed_parent(db, household, admin, make_user):
    """If a batch ever spans two parents, the parent is dropped like the entity id."""
    bob = make_user("bob")

    send(household, bob, admin, entity_id=1, entity_label="Dishes", parent_id=7)
    db.session.commit()
    send(household, bob, admin, entity_id=2, entity_label="Laundry", parent_id=8)
    db.session.commit()

    row = Notification.query.one()
    assert row.count == 2
    assert row.parent_id is None


# ---- TRIGGERS ----

def test_task_trigger_sets_parent(db, household, admin, make_user, make_tasklist, make_task):
    """A task notification carries its tasklist's id as the parent."""
    bob = make_user("bob")
    tasklist = make_tasklist(admin)
    task = make_task(tasklist, admin, assigned_to_id=bob.id)

    notify_task_assigned(task, admin)
    db.session.commit()

    row = Notification.query.filter_by(recipient_id=bob.id).one()
    assert row.entity_id == task.id
    assert row.parent_id == tasklist.id


def test_list_trigger_has_no_parent(db, household, admin, make_user, make_tasklist):
    """Lists are top-level: their notifications have no parent."""
    bob = make_user("bob")
    tasklist = make_tasklist(admin)

    notify_tasklist_deleted(tasklist, admin)
    db.session.commit()

    row = Notification.query.filter_by(recipient_id=bob.id).one()
    assert row.parent_id is None