from app.models.notification import Notification, NotificationType, NotificationEntity
from app.services.notification_service import NotificationService

def test_notifies_recipient(household, make_user):
    """One recipient gets one row"""
    alice = make_user("alice")
    bob = make_user("bob")

    NotificationService.notify(
        type=NotificationType.TASK_ASSIGNED,
        household_id=household.id,
        recipient_ids=[bob.id],
        actor_id=alice.id,
        entity_type=NotificationEntity.TASK,
        entity_id=1,
        entity_label="Dishes",
    )

    notifications = Notification.query.filter_by(recipient_id=bob.id).all()
    assert len(notifications) == 1

def test_skips_actor(db, household, make_user):
    """User doesn't get notified about their own actions"""
    alice = make_user("alice")   # actor
    bob = make_user("bob")

    notifications = NotificationService.notify(
        type=NotificationType.TASK_ASSIGNED,
        household_id=household.id,
        recipient_ids=[alice.id, bob.id],
        actor_id=alice.id,
        entity_type=NotificationEntity.TASK,
        entity_id=1,
        entity_label="Dishes",
    )
    db.session.commit()

    assert [n.recipient_id for n in notifications] == [bob.id]
    assert Notification.query.filter_by(recipient_id=alice.id).count() == 0
    assert Notification.query.filter_by(recipient_id=bob.id).count() == 1


def test_dedupes_recipients(household, make_user):
    """The same id twice gives one row"""
    alice = make_user("alice") 
    bob = make_user("bob")   

    NotificationService.notify(
        type=NotificationType.TASK_ASSIGNED,
        household_id=household.id,
        recipient_ids=[bob.id, bob.id],
        actor_id=alice.id,
        entity_type=NotificationEntity.TASK,
        entity_id=1,
        entity_label="Dishes",
    )

    notifications = Notification.query.filter_by(recipient_id=bob.id).all()
    assert len(notifications) == 1


def test_no_recipients(household, make_user):
    """Empty list returns [] and creates nothing"""
    alice=make_user("alice")
    notification = NotificationService.notify(
        type=NotificationType.TASK_ASSIGNED,
        household_id=household.id,
        recipient_ids=[],
        actor_id=alice.id,
        entity_type=NotificationEntity.TASK,
        entity_id=1,
        entity_label="Dishes",
    )
    notifications = Notification.query.all()
    assert len(notifications) == 0
    assert notification == []


def test_system_actor(household, make_user):
    """`actor_id = None` notifies everyone"""
    alice = make_user("alice")
    bob = make_user("bob")

    NotificationService.notify(
        type=NotificationType.TASK_ASSIGNED,
        household_id=household.id,
        recipient_ids=[alice.id, bob.id],
        actor_id=None,
        entity_type=NotificationEntity.TASK,
        entity_id=1,
        entity_label="Dishes",
    )

    notifications = Notification.query.all()
    assert len(notifications) == 2
    for n in notifications:
        assert n.actor_id is None


def test_stores_fields(household, make_user):
    """type, household, entity type, id and label are saved"""
    alice = make_user("alice")
    bob = make_user("bob")

    NotificationService.notify(
        type=NotificationType.TASK_ASSIGNED,
        household_id=household.id,
        recipient_ids=[bob.id],
        actor_id=alice.id,
        entity_type=NotificationEntity.TASK,
        entity_id=1,
        entity_label="Dishes",
    )

    notification = Notification.query.filter_by(recipient_id=bob.id).first()
    assert notification.type == NotificationType.TASK_ASSIGNED
    assert notification.household_id == household.id
    assert notification.actor_id == alice.id
    assert notification.entity_type == NotificationEntity.TASK
    assert notification.entity_id == 1
    assert notification.entity_label == "Dishes"


def test_starts_unread(household, make_user):
    """read_at is None, count == 1"""
    alice = make_user("alice")
    bob = make_user("bob")

    NotificationService.notify(
        type=NotificationType.TASK_ASSIGNED,
        household_id=household.id,
        recipient_ids=[bob.id],
        actor_id=alice.id,
        entity_type=NotificationEntity.TASK,
        entity_id=1,
        entity_label="Dishes",
    )

    notification = Notification.query.filter_by(recipient_id=bob.id).first()
    assert notification.count == 1
    assert notification.read_at is None

    
def test_labels_start_with_label(household, make_user):
    alice = make_user("alice")
    bob = make_user("bob")

    NotificationService.notify(
        type=NotificationType.TASK_ASSIGNED,
        household_id=household.id,
        recipient_ids=[bob.id],
        actor_id=alice.id,
        entity_type=NotificationEntity.TASK,
        entity_id=1,
        entity_label="Dishes",
    )

    notification = Notification.query.filter_by(recipient_id=bob.id).first()
    assert notification.entity_labels == ["Dishes"]


def test_labels_empty_without_label(household, make_user):
    alice = make_user("alice")
    bob = make_user("bob")

    NotificationService.notify(
        type=NotificationType.TASK_ASSIGNED,
        household_id=household.id,
        recipient_ids=[bob.id],
        actor_id=alice.id,
        entity_type=NotificationEntity.TASK,
        entity_id=1,
        entity_label=None,
    )

    notification = Notification.query.filter_by(recipient_id=bob.id).first()
    assert notification.entity_labels == []


def test_does_not_commit(db, household, make_user):
    """After session rollback, the rows are gone."""
    alice = make_user("alice")
    bob = make_user("bob")

    NotificationService.notify(
        type=NotificationType.TASK_ASSIGNED,
        household_id=household.id,
        recipient_ids=[bob.id],
        actor_id=alice.id,
        entity_type=NotificationEntity.TASK,
        entity_id=1,
        entity_label="Dishes",
    )

    assert Notification.query.count() == 1    

    db.session.rollback()
    notifications = Notification.query.all()
    assert len(notifications) == 0    