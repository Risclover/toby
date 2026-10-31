from app.models.notification import Notification, NotificationType, NotificationEntity
from app.services.notification_service import NotificationService

def test_notifies_recipient(household, make_user):
    alice = make_user("alice")
    bob = make_user("bob")

    NotificationService.notify(
        type=NotificationType.TASK_ASSIGNED,
        household_id=household.id,
        recipient_id=[bob.id],
        actor_id=alice.id,
        entity_type=NotificationEntity.TASK,
        entity_id=1,
        entity_label="Dishes",
    )

    notifications = Notification.query.filter_by(recipient_id=bob.id).all()
    assert len(notifications) == 1