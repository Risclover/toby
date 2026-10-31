from app.models.notification import Notification, NotificationType, NotificationEntity
from app.services.notification_service import NotificationService

def test_notifies_recipient(household, make_user):
    alice = make_uise