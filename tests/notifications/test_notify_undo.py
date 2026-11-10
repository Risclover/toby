from datetime import datetime, timedelta, timezone

from app.models.notification import Notification, NotificationEntity, NotificationType
from app.services.notification_service import NotificationService

T = NotificationType


def send(household, actor, recipient, type_, **overrides):
    """notify() with sensible defaults"""
    args = dict(
        type=type_,
        household_id=household.id,
        recipient_ids=[recipient.id],
        actor_id=actor.id,
        entity_type=NotificationEntity.TASK,
        entity_id=1,
        entity_label="Dishes",
    )
    args.update(overrides)
    return NotificationService.notify(**args)


def rows_for(user, type_=None):
    query = Notification.query.filter_by(recipient_id=user.id)
    return query.filter_by(type=type_).all() if type_ else query.all()


def test_unassign_cancels_unread_assign(db, household, make_user):
    """Assigning then unassigning before the person reads anything leaves nothing"""
    alice, bob = make_user("alice"), make_user("bob")

    send(household, alice, bob, T.TASK_ASSIGNED)
    send(household, alice, bob, T.TASK_UNASSIGNED)
    db.session.commit()

    assert rows_for(bob) == []


def test_assign_unassign_assign_leaves_one_assigned(db, household, make_user):
    """Assign, unassign, assign again: one 'assigned' and no 'unassigned'"""
    alice, bob = make_user("alice"), make_user("bob")

    send(household, alice, bob, T.TASK_ASSIGNED)
    send(household, alice, bob, T.TASK_UNASSIGNED)
    send(household, alice, bob, T.TASK_ASSIGNED)
    db.session.commit()

    rows = rows_for(bob)
    assert [row.type for row in rows] == [T.TASK_ASSIGNED]


def test_unassign_after_read_assign_is_sent(db, household, make_user):
    """If the person read the assignment, the unassignment is real news"""
    alice, bob = make_user("alice"), make_user("bob")

    send(household, alice, bob, T.TASK_ASSIGNED)
    rows_for(bob)[0].read_at = datetime.now(timezone.utc)
    db.session.commit()
    send(household, alice, bob, T.TASK_UNASSIGNED)
    db.session.commit()

    assert len(rows_for(bob, T.TASK_UNASSIGNED)) == 1
    assert len(rows_for(bob, T.TASK_ASSIGNED)) == 1


def test_assign_cancels_unread_unassign(db, household, make_user):
    """Unassigning then re-assigning leaves the earlier (read) assignment as the only record"""
    alice, bob = make_user("alice"), make_user("bob")

    send(household, alice, bob, T.TASK_ASSIGNED)
    rows_for(bob)[0].read_at = datetime.now(timezone.utc)
    db.session.commit()
    send(household, alice, bob, T.TASK_UNASSIGNED)
    send(household, alice, bob, T.TASK_ASSIGNED)
    db.session.commit()

    assert [row.type for row in rows_for(bob)] == [T.TASK_ASSIGNED]


def test_cancels_across_actors(db, household, make_user):
    """It doesn't matter who undid it: what Bob would see is unchanged"""
    alice, bob, carol = make_user("alice"), make_user("bob"), make_user("carol")

    send(household, alice, bob, T.TASK_ASSIGNED)
    send(household, carol, bob, T.TASK_UNASSIGNED)
    db.session.commit()

    assert rows_for(bob) == []


def test_other_entity_is_not_cancelled(db, household, make_user):
    """Unassigning from one task doesn't retract the assignment to a different task"""
    alice, bob = make_user("alice"), make_user("bob")

    send(household, alice, bob, T.TASK_ASSIGNED, entity_id=1)
    send(household, alice, bob, T.TASK_UNASSIGNED, entity_id=2, entity_label="Laundry")
    db.session.commit()

    assert len(rows_for(bob)) == 2


def test_other_recipient_is_not_cancelled(db, household, make_user):
    """Unassigning Carol doesn't retract Bob's assignment"""
    alice, bob, carol = make_user("alice"), make_user("bob"), make_user("carol")

    send(household, alice, bob, T.TASK_ASSIGNED)
    send(household, alice, carol, T.TASK_UNASSIGNED)
    db.session.commit()

    assert len(rows_for(bob, T.TASK_ASSIGNED)) == 1
    assert len(rows_for(carol, T.TASK_UNASSIGNED)) == 1


def test_not_cancelled_after_window(db, household, make_user):
    """An old unread assignment is history, not something to quietly retract"""
    alice, bob = make_user("alice"), make_user("bob")

    send(household, alice, bob, T.TASK_ASSIGNED)
    rows_for(bob)[0].created_at = datetime.now(timezone.utc) - timedelta(minutes=20)
    db.session.commit()
    send(household, alice, bob, T.TASK_UNASSIGNED)
    db.session.commit()

    assert len(rows_for(bob)) == 2


def test_folded_row_is_not_cancelled(db, household, make_user):
    """A row folded from several tasks can't be undone by one unassign"""
    alice, bob = make_user("alice"), make_user("bob")

    send(household, alice, bob, T.TASK_ASSIGNED, entity_id=1, batch_key="task-assigned-1")
    send(household, alice, bob, T.TASK_ASSIGNED, entity_id=2, entity_label="Laundry",
         batch_key="task-assigned-1")
    send(household, alice, bob, T.TASK_UNASSIGNED, entity_id=1)
    db.session.commit()

    assert len(rows_for(bob, T.TASK_ASSIGNED)) == 1
    assert len(rows_for(bob, T.TASK_UNASSIGNED)) == 1


def test_reopen_cancels_unread_complete(db, household, make_user):
    """Completing then reopening a task before the assignee looks leaves nothing"""
    alice, bob = make_user("alice"), make_user("bob")

    send(household, alice, bob, T.TASK_COMPLETED)
    send(household, alice, bob, T.TASK_REOPENED)
    db.session.commit()

    assert rows_for(bob) == []


def test_tasklist_assign_then_unassign_cancels(db, household, make_user):
    """The same rule applies to task lists"""
    alice, bob = make_user("alice"), make_user("bob")
    args = dict(entity_type=NotificationEntity.TASKLIST, entity_label="Chores")

    send(household, alice, bob, T.TASKLIST_ASSIGNED, **args)
    send(household, alice, bob, T.TASKLIST_UNASSIGNED, **args)
    db.session.commit()

    assert rows_for(bob) == []


def test_event_assign_then_unassign_cancels(db, household, make_user):
    """The same rule applies to events"""
    alice, bob = make_user("alice"), make_user("bob")
    args = dict(entity_type=NotificationEntity.EVENT, entity_label="Dinner")

    send(household, alice, bob, T.EVENT_ASSIGNED, **args)
    send(household, alice, bob, T.EVENT_UNASSIGNED, **args)
    db.session.commit()

    assert rows_for(bob) == []