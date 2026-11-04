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
        now = datetime.now(timezone.utc)
        window = now - timedelta(minutes=BATCH_WINDOW_MINUTES)

        notifications = []
        for recipient_id in dict.fromkeys(recipient_ids):
            if recipient_id == actor_id:
                continue
                
            existing = None
            if batch_key:
                existing = (
                    Notification.query
                    .filter(
                        Notification.recipient_id == recipient_id,
                        Notification.household_id == household_id,
                        Notification.actor_id == actor_id,
                        Notification.type == type,
                        Notification.entity_type == entity_type,
                        Notification.batch_key == batch_key,
                        Notification.read_at.is_(None),
                        Notification.created_at >= window,
                    )
                    .order_by(Notification.created_at.desc())
                    .first()
                )

            if existing:
                labels = list(existing.entity_labels or [])
                is_repeat = bool(entity_label) and entity_label in labels
                if not is_repeat:
                    existing.count += 1
                    if entity_label:
                        labels.append(entity_label)
                existing.entity_labels = labels
                if existing.entity_id != entity_id:
                    existing.entity_id = None 
                existing.created_at = now
                notifications.append(existing)
                continue

            notification = Notification(
                household_id=household_id,
                recipient_id=recipient_id,
                actor_id=actor_id,
                type=type,
                entity_type=entity_type,
                entity_id=entity_id,
                entity_label=entity_label,
                entity_labels=[entity_label] if entity_label else [],
                batch_key=batch_key,
            )
            db.session.add(notification)
            notifications.append(notification)
        return notifications