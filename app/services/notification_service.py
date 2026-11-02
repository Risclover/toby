from app.extensions import db
from app.models.notification import Notification
from datetime import datetime, timezone, timedelta

BATCH_WINDOW_MINUTES = 15

class NotificationService:
    @staticmethod
    def notify(
        type,
        household_id,
        recipient_ids,
        actor_id,
        entity_type=None,
        entity_id=None,
        entity_label=None,
        event_metadata=None,
        batch_key=None,
    ):
        """Notify each recipient. Never commits."""
        notifications = []
        for recipient_id in dict.fromkeys(recipient_ids):
            notification = Notification(
                household_id=household_id,
                recipient_id=recipient_id,
                actor_id=actor_id,
                type=type,
                entity_type=entity_type,
                entity_id=entity_id,
                entity_label=entity_label,
                entity_labels=[entity_label] if entity_label else [],
            )
            db.session.add(notification)
            notifications.append(notification)
        return notifications