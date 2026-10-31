from app.extensions import db
from sqlalchemy import Enum as SAEnum
import enum 
from datetime import datetime, timezone

class NotificationType(str, enum.Enum):
    TASK_ASSIGNED = "task_assigned"
    EVENT_ASSIGNED = "event_assigned"
    EVENT_CHANGED = "event_changed"
    EVENT_DELETED = "event_deleted"
    TASKLIST_ASSIGNED = "tasklist_assigned"
    TASKLIST_DELETED = "tasklist_deleted"
    TASK_CHANGED = "task_changed"
    TASK_DELETED = "task_deleted"
    MEMBER_JOINED = "member_joined"
    MEMBER_LEFT = "member_left"
    MEMBER_REMOVED = "member_removed"
    SHOPPING_LIST_ASSIGNED = "shopping_list_assigned"
    SHOPPING_LIST_DELETED = "shopping_list_deleted"
    REMINDER_ASSIGNED = "reminder_assigned"
    ANNOUNCEMENT_EDITED = "announcement_edited"
    ANNOUNCEMENT_DELETED = "announcement_deleted"
    ADMIN_CHANGED = "admin_changed"
    ADMIN_REQUEST = "admin_request"

class NotificationEntity(str, enum.Enum):
    TASK = "task"
    EVENT = "event"
    SHOPPING_LIST = "shopping_list"
    TASKLIST = "tasklist"
    USER = "user"
    REMINDER = "reminder"
    ANNOUNCEMENT = "announcement"

def _utcnow():
    return datetime.now(timezone.utc)


def _iso(dt):
    """ISO-8601 in UTC, whether the database returns naive or aware datetimes."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    recipient_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    household_id = db.Column(db.Integer, db.ForeignKey("households.id", ondelete="CASCADE"), nullable=False)
    actor_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    type = db.Column(SAEnum(NotificationType, native_enum=False, length=32), nullable=False)

    entity_type = db.Column(SAEnum(NotificationEntity, native_enum=False, length=16), nullable=True)
    entity_id = db.Column(db.Integer, nullable=True)

    entity_label = db.Column(db.String(255), nullable=True)
    entity_labels = db.Column(db.JSON, nullable=True)
    event_metadata = db.Column(db.JSON, nullable=True)

    batch_key = db.Column(db.String(100), nullable=True)
    count = db.Column(db.Integer, nullable=False, default=1)

    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow)
    read_at = db.Column(db.DateTime(timezone=True), nullable=True)

    # relationships
    actor = db.relationship("User", foreign_keys=[actor_id], lazy="joined")

    # indices
    __table_args__ = (
        db.Index("ix_notifications_recipient_read", "recipient_id", "read_at"),
        db.Index("ix_notifications_recipient_created", "recipient_id", "created_at"),
    )

    def to_dict(self):
        actor = (
            {
                "id": self.actor.id,
                "displayName": self.actor.display_name,
                "profileImg": self.actor.profile_img,
            }
            if self.actor
            else None  # frontend shows Toby / "a former member"
        )
        return {
            "id": self.id,
            "recipientId": self.recipient_id,
            "householdId": self.household_id,
            "actor": actor,
            "type": self.type.value,
            "entityType": self.entity_type.value if self.entity_type else None,
            "entityId": self.entity_id,
            "entityLabel": self.entity_label,
            "entityLabels": self.entity_labels or [],
            "eventMetadata": self.event_metadata,
            "count": self.count,
            "createdAt": _iso(self.created_at),
            "readAt": _iso(self.read_at),
        }

    def __repr__(self):
        return f"<Notification {self.id}: {self.type.value} -> user {self.recipient_id}>"