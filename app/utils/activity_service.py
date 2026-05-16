from app.extensions import db
from app.models.activity_event import ActivityEvent

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
    ):
        event = ActivityEvent(
            household_id=household_id,
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_label=entity_label,
            event_metadata=event_metadata,
            audience_ids=audience_ids, 
        )
        db.session.add(event)
        return event