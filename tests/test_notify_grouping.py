from app.models.notification import Notification, NotificationType, NotificationEntity
from app.services.notification_service import NotificationService
from datetime import datetime, timedelta, timezone

# Helpers
def assign_task(household, actor, recipient, **overrides):
    """notify() with sensible defaults"""
    args = dict(
        type=NotificationType.TASK_ASSIGNED,
        household_id=household.id,
        recipient_ids=[recipient.id],
        actor_id=actor.id,
        entity_type=NotificationEntity.TASK,
        entity_id=1,
        entity_label="Dishes",
    )
    args.update(overrides)
    return NotificationService.notify(**args)



# Tests
def test_no_batch_key_no_fold(household, make_user):
    """Without a batch key, each call creates a new row"""
    alice = make_user("alice")
    bob = make_user("bob")

    assign_task(household, alice, bob, entity_label="Dishes")
    assign_task(household, alice, bob, entity_label="Laundry")

    notifications = Notification.query.filter_by(recipient_id=bob.id).all()
    assert len(notifications) == 2


def test_folds_same_batch_key(household, make_user):
    """With a batch key, multiple calls within the window fold into one row"""
    alice = make_user("alice")
    bob = make_user("bob")

    assign_task(household, alice, bob, entity_label="Dishes", batch_key="batch1")
    assign_task(household, alice, bob, entity_label="Laundry", batch_key="batch1")

    notifications = Notification.query.filter_by(recipient_id=bob.id).all()
    assert len(notifications) == 1
    notification = notifications[0]
    assert notification.entity_labels == ["Dishes", "Laundry"]


def test_fold_adds_label(household, make_user):
    """If the label is new, it gets added to the list"""
    alice = make_user("alice")
    bob = make_user("bob")

    assign_task(household, alice, bob, entity_label="Dishes", batch_key="batch1")
    assign_task(household, alice, bob, entity_label="Laundry", batch_key="batch1")
    assign_task(household, alice, bob, entity_label="Dishes", batch_key="batch1")

    notifications = Notification.query.filter_by(recipient_id=bob.id).all()
    assert len(notifications) == 1
    notification = notifications[0]
    assert notification.entity_labels == ["Dishes", "Laundry"]


def test_fold_skips_duplicate_label(household, make_user):
    """If the label is already in the list, it doesn't get added again"""
    alice = make_user("alice")
    bob = make_user("bob")

    assign_task(household, alice, bob, entity_label="Dishes", batch_key="batch1")
    assign_task(household, alice, bob, entity_label="Dishes", batch_key="batch1")

    notifications = Notification.query.filter_by(recipient_id=bob.id).all()
    assert len(notifications) == 1
    notification = notifications[0]
    assert notification.entity_labels == ["Dishes"]


def test_fold_updates_created_at(db, household, make_user):
    """The created_at timestamp is updated to the latest call"""
    alice = make_user("alice")
    bob = make_user("bob")

    assign_task(household, alice, bob, entity_label="Dishes", batch_key="batch1")
    notification = Notification.query.filter_by(recipient_id=bob.id).one()

    # Backdate it, still inside the 15-minute window, so the time update is unmistakable.
    notification.created_at = datetime.now(timezone.utc) - timedelta(minutes=10)
    db.session.commit()
    backdated = notification.created_at   

    assign_task(household, alice, bob, entity_label="Laundry", batch_key="batch1")
    db.session.commit()            
    folded = Notification.query.filter_by(recipient_id=bob.id).one()

    assert folded.created_at > backdated


def test_no_fold_after_window(db, household, make_user):
    """After the window, a new row is created"""
    alice = make_user("alice")
    bob = make_user("bob")

    assign_task(household, alice, bob, entity_label="Dishes", batch_key="batch1")
    notification = Notification.query.filter_by(recipient_id=bob.id).one()

    notification.created_at = datetime.now(timezone.utc) - timedelta(minutes=20)
    db.session.commit()

    assign_task(household, alice, bob, entity_label="Laundry", batch_key="batch1")
    db.session.commit()
    notifications = Notification.query.filter_by(recipient_id=bob.id).all()

    assert len(notifications) == 2


def test_no_fold_into_read_row(db, household, make_user):
    """If the existing row is read, a new row is created"""
    alice = make_user("alice")
    bob = make_user("bob")

    assign_task(household, alice, bob, entity_label="Dishes", batch_key="batch1")
    notification = Notification.query.filter_by(recipient_id=bob.id).one()

    notification.read_at = datetime.now(timezone.utc)
    db.session.commit()

    assign_task(household, alice, bob, entity_label="Laundry", batch_key="batch1")
    db.session.commit()
    notifications = Notification.query.filter_by(recipient_id=bob.id).all()

    assert len(notifications) == 2


def test_no_fold_other_actor(db, household, make_user):
    """If the existing row is from a different actor, a new row is created"""
    alice = make_user("alice")
    bob = make_user("bob")
    charlie = make_user("charlie")

    assign_task(household, alice, bob, entity_label="Dishes", batch_key="batch1")
    assign_task(household, charlie, bob, entity_label="Laundry", batch_key="batch1")
    db.session.commit()

    notifications = Notification.query.filter_by(recipient_id=bob.id).all()
    assert len(notifications) == 2


def test_no_fold_other_type(db, household, make_user):
    """If the existing row is a different type, a new row is created"""
    alice = make_user("alice")
    bob = make_user("bob")

    assign_task(household, alice, bob, entity_label="Dishes", batch_key="batch1")
    assign_task(
        household,
        alice,
        bob,
        entity_label="Laundry",
        batch_key="batch1",
        type=NotificationType.TASK_COMPLETED,
    )
    db.session.commit()

    notifications = Notification.query.filter_by(recipient_id=bob.id).all()
    assert len(notifications) == 2


def test_no_fold_other_batch_key(db, household, make_user):
    """If the existing row has a different batch key, a new row is created"""
    alice = make_user("alice")
    bob = make_user("bob")

    assign_task(household, alice, bob, entity_label="Dishes", batch_key="batch1")
    assign_task(household, alice, bob, entity_label="Laundry", batch_key="batch2")
    db.session.commit()

    notifications = Notification.query.filter_by(recipient_id=bob.id).all()
    assert len(notifications) == 2


def test_no_fold_other_recipient(db, household, make_user):
    """If the existing row is for a different recipient, a new row is created"""
    alice = make_user("alice")
    bob = make_user("bob")
    charlie = make_user("charlie")

    assign_task(household, alice, bob, entity_label="Dishes", batch_key="batch1")
    assign_task(household, alice, charlie, entity_label="Laundry", batch_key="batch1")
    db.session.commit()

    notifications = Notification.query.all()
    assert Notification.query.filter_by(recipient_id=bob.id).count() == 1
    assert Notification.query.filter_by(recipient_id=charlie.id).count() == 1


def test_folds_per_recipient(db, household, make_user):
    """One call, two recipients, each folds into their own row"""
    alice = make_user("alice")
    bob = make_user("bob")
    charlie = make_user("charlie")

    assign_task(household, alice, bob, recipient_ids=[bob.id, charlie.id], entity_label="Dishes", batch_key="batch1")
    assign_task(household, alice, bob, recipient_ids=[bob.id, charlie.id], entity_label="Laundry", batch_key="batch1")
    db.session.commit()

    assert Notification.query.count() == 2

    for user in (bob, charlie):
        row = Notification.query.filter_by(recipient_id=user.id).one()
        assert row.entity_labels == ["Dishes", "Laundry"]


def test_fold_counts_new_labels(household, make_user):
    alice = make_user("alice")
    bob = make_user("bob")

    assign_task(household, alice, bob, entity_label="Dishes", batch_key="b")
    assign_task(household, alice, bob, entity_label="Laundry", batch_key="b")

    assert Notification.query.filter_by(recipient_id=bob.id).one().count == 2


def test_fold_duplicate_label_keeps_count(household, make_user):
    alice = make_user("alice")
    bob = make_user("bob")

    assign_task(household, alice, bob, entity_label="Dishes", batch_key="b")
    assign_task(household, alice, bob, entity_label="Dishes", batch_key="b")

    assert Notification.query.filter_by(recipient_id=bob.id).one().count == 1


def test_fold_clears_entity_id(household, make_user):
    alice = make_user("alice")
    bob = make_user("bob")

    assign_task(household, alice, bob, entity_id=1, entity_label="Dishes", batch_key="b")
    assign_task(household, alice, bob, entity_id=2, entity_label="Laundry", batch_key="b")

    assert Notification.query.filter_by(recipient_id=bob.id).one().entity_id is None


def test_fold_same_entity_keeps_entity_id(household, make_user):
    alice = make_user("alice")
    bob = make_user("bob")

    assign_task(household, alice, bob, entity_id=1, batch_key="b")
    assign_task(household, alice, bob, entity_id=1, batch_key="b")

    assert Notification.query.filter_by(recipient_id=bob.id).one().entity_id == 1