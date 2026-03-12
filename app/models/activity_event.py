from app.extensions import db
from datetime import datetime, timezone 

class ActivityEvent(db.Model):
    __tablename__ = "activity_events"

    id = db.Column(db.Integer, primary_key=True)
    household_id = db.Column(db.Integer, db.ForeignKey("households.id"), nullable=False)
    actor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    action = db.Column(db.String(50), nullable=False)
    entity_type = db.Column(db.String(50), nullable=False)
    entity_id = db.Column(db.Integer, nullable=True)
    entity_label = db.Column(db.String(255), nullable=True)
    event_metadata = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    
    # relationships
    actor = db.relationship("User", foreign_keys=[actor_id])
    household = db.relationship("Household", foreign_keys=[household_id])

    def to_dict(self):
        return {
            "id": self.id,
            "householdId": self.household_id,
            "actor": {
                "id": self.actor_id,
                "displayName": self.actor.display_name,
                "profileImg": self.actor.profile_img,
            },
            "action": self.action,
            "entityType": self.entity_type,
            "entityId": self.entity_id,
            "entityLabel": self.entity_label,
            "eventMetadata": self.event_metadata,
            "createdAt": self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<ActivityEvent {self.id}: {self.actor_id} {self.action} {self.entity_type}>"