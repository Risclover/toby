from datetime import datetime, timedelta, timezone

from app.extensions import db
from app.models.notification import Notification, NotificationType

BATCH_WINDOW_MINUTES = 15
RETENTION_DAYS = 30

_OPPOSITE_PAIRS = [
    (NotificationType.TASK_ASSIGNED, NotificationType.TASK_UNASSIGNED),
    (NotificationType.TASK_COMPLETED, NotificationType.TASK_REOPENED),
    (NotificationType.TASKLIST_ASSIGNED, NotificationType.TASKLIST_UNASSIGNED),
    (NotificationType.EVENT_ASSIGNED, NotificationType.EVENT_UNASSIGNED),
]
OPPOSITE_TYPES = {
    **{first: second for first, second in _OPPOSITE_PAIRS},
    **{second: first for first, second in _OPPOSITE_PAIRS},
}


def _find_foldable(*, recipient_id, household_id, actor_id, type, entity_type, batch_key, now):
    """The newest unread notification this one can fold into, or None."""
    window = now - timedelta(minutes=BATCH_WINDOW_MINUTES)
    return (
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

def _find_undoable(*, recipient_id, household_id, type, entity_type, entity_id, now):
    """An unread, unfolded notification that the one being sent would cancel out.

    Folded rows (count > 1) are skipped: they no longer point at a single entity.
    """
    opposite = OPPOSITE_TYPES.get(type)
    if opposite is None or entity_id is None:
        return None
    window = now - timedelta(minutes=BATCH_WINDOW_MINUTES)
    return (
        Notification.query
        .filter(
            Notification.recipient_id == recipient_id,
            Notification.household_id == household_id,
            Notification.type == opposite,
            Notification.entity_type == entity_type,
            Notification.entity_id == entity_id,
            Notification.count == 1,
            Notification.read_at.is_(None),
            Notification.created_at >= window,
        )
        .order_by(Notification.created_at.desc())
        .first()
    )

def _fold_into(existing, entity_id, entity_label, now):
    """Merge a new occurrence into an existing notification."""
    labels = list(existing.entity_labels or [])
    is_repeat = bool(entity_label) and entity_label in labels
    if not is_repeat:
        existing.count += 1
        if entity_label:
            labels.append(entity_label)
    existing.entity_labels = labels
    if existing.entity_id != entity_id:
        existing.entity_id = None      # one id can't point at two different entities
    existing.created_at = now


class NotificationService:
    @staticmethod
    def notify(type, household_id, recipient_ids, actor_id, entity_type=None, entity_id=None,
               entity_label=None, event_metadata=None, batch_key=None):
        """Notify each recipient. Never commits.

        Skips the actor. If the notification undoes an unread one (assigned vs
        unassigned, completed vs reopened), both disappear. Otherwise it folds into a
        matching unread row, or creates a new one.
        """
        now = datetime.now(timezone.utc)
        notifications = []

        for recipient_id in dict.fromkeys(recipient_ids):
            if recipient_id == actor_id:
                continue

            undone = _find_undoable(
                recipient_id=recipient_id, household_id=household_id, type=type,
                entity_type=entity_type, entity_id=entity_id, now=now,
            )
            if undone:
                db.session.delete(undone)
                continue

            existing = None
            if batch_key:
                existing = _find_foldable(
                    recipient_id=recipient_id, household_id=household_id, actor_id=actor_id,
                    type=type, entity_type=entity_type, batch_key=batch_key, now=now,
                )

            if existing:
                _fold_into(existing, entity_id, entity_label, now)
                notifications.append(existing)
                continue

            notification = Notification(
                household_id=household_id, recipient_id=recipient_id, actor_id=actor_id,
                type=type, entity_type=entity_type, entity_id=entity_id,
                entity_label=entity_label,
                entity_labels=[entity_label] if entity_label else [],
                batch_key=batch_key,
            )
            db.session.add(notification)
            notifications.append(notification)

        return notifications

    @staticmethod
    def prune_read(user_id):
        """Delete this user's notifications read more than RETENTION_DAYS ago. Never commits."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)
        return (
            Notification.query
            .filter(
                Notification.recipient_id == user_id,
                Notification.read_at < cutoff,
            )
            .delete(synchronize_session=False)
        )