from app.extensions import db
from sqlalchemy import Enum as SAEnum
import enum 
from datetime import datetime, timezone

class NotificationType(str, enum.Enum):
    # Events
    EVENT_ASSIGNED = "event_assigned" # User was assigned to an event
    EVENT_UNASSIGNED = "event_unassigned" # User was unassigned from event
    EVENT_CHANGED = "event_changed" # Event user assigned to was changed; OR, event user created was changed (by someone else)
    EVENT_DELETED = "event_deleted" # Event user assigned to was deleted; OR, event user created was deleted (by someone else)

     # Tasklists
    TASKLIST_ASSIGNED = "tasklist_assigned" # User assigned to a tasklist
    TASKLIST_UNASSIGNED = "tasklist_unassigned" # User unassigned from tasklist
    TASKLIST_DELETED = "tasklist_deleted" # Tasklist user assigned to was deleted; OR, tasklist user created was deleted (by someone else)
    
    # Tasks
    TASK_ASSIGNED = "task_assigned" # User was assigned to a task
    TASK_UNASSIGNED = "task_unassigned" # User was unassigned from task
    TASK_CHANGED = "task_changed" # Task assigned to was changed; OR, task user created was changed by someone else
    TASK_DELETED = "task_deleted" # Task assigned to was deleted; OR, task user created was deleted by someone else
    TASK_COMPLETED = "task_completed" # A task user is assigned to was completed by someone else
    TASK_REOPENED = "task_reopened" # A task user is assigned to was reopened by someone else
    TASK_OVERDUE = "task_overdue" # A task user is assigned to is overdue

    # Shopping lists
    SHOPPING_LIST_ASSIGNED = "shopping_list_assigned" # User assigned to shopping list 
    SHOPPING_LIST_UNASSIGNED = "shopping_list_unassigned" # User unassigned from shopping list
    SHOPPING_LIST_DELETED = "shopping_list_deleted" # Assigned shopping list deleted; OR, list user created was deleted by someone else

    # Reminders
    REMINDER_ASSIGNED = "reminder_assigned" # User given reminder by another user 

    # Announcements
    ANNOUNCEMENT_EDITED = "announcement_edited" # Announcement user created was edited
    ANNOUNCEMENT_DELETED = "announcement_deleted" # Announcement user created was deleted

    # Household
    ADMIN_CHANGED = "admin_changed" # Household admin changed
    ADMIN_REQUEST = "admin_request" # Admin requesting user to become admin
    MEMBER_JOINED = "member_joined" # Member joined household
    MEMBER_LEFT = "member_left" # Member left household
    MEMBER_REMOVED = "member_removed" # Member removed from household 
    USER_REMOVED = "user_removed" # Current user removed from household


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

    entity_id = db.Column(db.Integer, nullable=True)
    entity_type = db.Column(SAEnum(NotificationEntity, native_enum=False, length=16), nullable=True)
    entity_label = db.Column(db.String(255), nullable=True)
    entity_labels = db.Column(db.JSON, nullable=True)

    batch_key = db.Column(db.String(100), nullable=True)
    count = db.Column(db.Integer, nullable=False, default=1)

    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow)
    read_at = db.Column(db.DateTime(timezone=True), nullable=True)

    # Relationships
    actor = db.relationship("User", foreign_keys=[actor_id], lazy="joined")

    # Indices
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
            "count": self.count,
            "createdAt": _iso(self.created_at),
            "readAt": _iso(self.read_at),
        }

    def __repr__(self):
        return f"<Notification {self.id}: {self.type.value} -> user {self.recipient_id}>"