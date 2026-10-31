from app.extensions import db
from app.models.activity_event import ActivityEvent
from datetime import datetime, timezone, timedelta

BATCH_WINDOW_MINUTES = 5


class ActivityService:
    @staticmethod
    def record(
        household_id,
        actor_id,
        action,
        entity_type,
        entity_id=None,
        entity_label=None,
        event_metadata=None,
        audience_ids=None,
        batch_key=None,
    ):
        if batch_key:
            window = datetime.now(timezone.utc) - timedelta(minutes=BATCH_WINDOW_MINUTES)
            existing = (
                ActivityEvent.query
                .filter(
                    ActivityEvent.household_id == household_id,
                    ActivityEvent.actor_id == actor_id,
                    ActivityEvent.action == action,
                    ActivityEvent.entity_type == entity_type,
                    ActivityEvent.batch_key == batch_key,
                    ActivityEvent.created_at >= window,
                )
                .order_by(ActivityEvent.created_at.desc())
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

        event = ActivityEvent(
            household_id=household_id,
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_label=entity_label,
            entity_labels=[entity_label] if entity_label else [],
            event_metadata=event_metadata,
            audience_ids=audience_ids,
            batch_key=batch_key,
        )
        db.session.add(event)
        return event