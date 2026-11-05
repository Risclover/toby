from datetime import datetime, timedelta, timezone

from app.models.notification import Notification
from app.services import NotificationService
from app.services.notification_service import RETENTION_DAYS


def _days_ago(days):
    return datetime.now(timezone.utc) - timedelta(days=days)


def test_prune_deletes_old_read(db, make_user, make_notification):
    """A notification read longer ago than the retention window is deleted"""
    bob = make_user("bob")
    make_notification(bob, read_at=_days_ago(RETENTION_DAYS + 1))

    NotificationService.prune_read(bob.id)
    db.session.commit()

    assert Notification.query.filter_by(recipient_id=bob.id).count() == 0


def test_prune_keeps_recent_read(db, make_user, make_notification):
    """A notification read recently is kept"""
    bob = make_user("bob")
    make_notification(
        bob,
        created_at=_days_ago(RETENTION_DAYS * 2), 
        read_at=_days_ago(1),                       
    )

    NotificationService.prune_read(bob.id)
    db.session.commit()

    assert Notification.query.filter_by(recipient_id=bob.id).count() == 1


def test_prune_keeps_unread(db, make_user, make_notification):
    """An unread notification is never deleted"""
    bob = make_user("bob")
    make_notification(bob, created_at=_days_ago(RETENTION_DAYS * 2))  

    NotificationService.prune_read(bob.id)
    db.session.commit()

    assert Notification.query.filter_by(recipient_id=bob.id).count() == 1


def test_prune_only_own(db, make_user, make_notification):
    """Pruning one user's notifications never deletes another user's"""
    alice = make_user("alice")
    bob = make_user("bob")
    make_notification(alice, read_at=_days_ago(RETENTION_DAYS + 1))
    make_notification(bob, read_at=_days_ago(RETENTION_DAYS + 1))

    NotificationService.prune_read(bob.id)
    db.session.commit()

    assert Notification.query.filter_by(recipient_id=alice.id).count() == 1
    assert Notification.query.filter_by(recipient_id=bob.id).count() == 0