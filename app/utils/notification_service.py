from app.extensions import db
from app.models.notification import Notification
from datetime import datetime, timezone, timedelta

BATCH_WINDOW_MINUTES = 15

class NotificationService:
    @staticmethod
    def record(
        household_id,
        recipient_id,
        actor_id,
        type,
        entity_type,
        entity_id=None,
        entity_label=None,
        event_metadata=None,
        batch_key=None
    ):
        if batch_key:
            window = datetime.now(timezone.utc) - timedelta(minutes=BATCH_WINDOW_MINUTES)
            existing = (
                Notification.query
                .filter(
                    Notification.household_id == household_id,
                    Notification.recipient_id == recipient_id,
                    Notification.actor_id == actor_id,
                    Notification.entity_type == entity_type,
                    Notification.batch_key == batch_key,
                    Notification.created_at >= window,
                )
                .order_by(Notification.created_at.desc())
                .first()
            )

            if existing:
                existing.count += 1
                labels = list(existing.entity_labels or [])
                if entity_label and entity_label not in labels:
                    labels.append(entity_label)
                existing.entity_labels = labels
                existing.created_at = datetime.now(timezone.utc)
                return existing
        
        notification = Notification(
            household_id=household_id,
            recipient_id=recipient_id,
            actor_id=actor_id,
            entity_type=entity_type,
            entity_label=entity_label,
            entity_labels=[entity_label] if entity_label else [],
            event_metadata=event_metadata,
            batch_key=batch_key
        )

        db.session.add(notification)
        return notification