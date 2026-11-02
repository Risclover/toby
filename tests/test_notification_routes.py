import pytest
from app.models.notification import Notification, NotificationType, NotificationEntity
from app.services.notification_service import NotificationService
from datetime import datetime, timedelta, timezone

# Helpers
def _ids(response):
    return [item["id"] for item in response.get_json()["items"]]



# Tests
PROTECTED = [
    ("get", "/api/notifications"),
]

@pytest.mark.parametrize("method, url", PROTECTED)
def test_requires_login(client, method, url):
    response = getattr(client, method)(url)
    assert response.status_code == 401


def test_list_returns_mine(client, login, make_user, make_notification):
    """List returns logged-in user's notifications"""
    bob = make_user("bob")
    make_notification(bob, entity_label="Dishes")
    login(bob)

    response = client.get("/api/notifications")

    assert response.status_code == 200
    items = response.get_json()["items"]
    assert len(items) == 1
    assert items[0]["entityLabel"] == "Dishes"


def test_list_only_mine(client, login, make_user, make_notification):
    """List returns only logged-in user's notifications"""
    alice = make_user("alice")
    bob = make_user("bob")
    mine = make_notification(bob)
    make_notification(alice)
    login(bob)

    response = client.get("/api/notifications")

    assert _ids(response) == [mine.id]


def test_list_newest_first(client, login, make_user, make_notification):
    """List returns newest notifications first"""
    bob = make_user("bob")
    now = datetime.now(timezone.utc)
    older = make_notification(bob, created_at=now - timedelta(hours=2))
    newest = make_notification(bob, created_at=now)
    middle = make_notification(bob, created_at=now - timedelta(hours=1))
    login(bob)

    response = client.get("/api/notifications")

    assert _ids(response) == [newest.id, middle.id, older.id]


def test_list_limit(client, login, make_user, make_notification):
    """Limit parameter is honored"""
    bob = make_user("bob")
    for _ in range(3):
        make_notification(bob)
    login(bob)

    response = client.get("/api/notifications?limit=2")
    
    assert len(response.get_json()["items"]) == 2


def test_list_default_limit(client, login, make_user, make_notification):
    """Default limit is 20"""
    bob = make_user("bob")
    for _ in range(25):
        make_notification(bob)
    login(bob)

    response = client.get("/api/notifications")

    assert len(response.get_json()["items"]) == 20


def test_list_limit_capped(client, login, make_user, make_notification):
    """Limit is capped at 100"""
    bob = make_user("bob")
    for _ in range(101):
        make_notification(bob)
    login(bob)

    response = client.get("/api/notifications?limit=1000")

    assert len(response.get_json()["items"]) == 100


def test_list_next_cursor(client, login, make_user, make_notification):
    """Next cursor is returned when there are more items"""
    bob = make_user("bob")
    now = datetime.now(timezone.utc)
    for minutes in (0, 1, 2):
        make_notification(bob, created_at=now - timedelta(minutes=minutes))
    login(bob)

    first = client.get("/api/notifications?limit=2")
    cursor = first.get_json()["nextCursor"]
    assert cursor is not None

    second = client.get(f"/api/notifications?limit=2&cursor={cursor}")

    assert len(second.get_json()["items"]) == 1
    assert second.get_json()["nextCursor"] is None


def test_cursor_ties(client, login, make_user, make_notification):
    """Paging never skips or repeats a row when several notifications have the same created_at"""
    bob = make_user("bob")
    now = datetime.now(timezone.utc)
    created = [make_notification(bob, created_at=now) for _ in range(3)]
    login(bob)

    first = client.get("/api/notifications?limit=2")
    cursor = first.get_json()["nextCursor"]
    second = client.get(f"/api/notifications?limit=2&cursor={cursor}")

    seen = _ids(first) + _ids(second)
    assert sorted(seen) == sorted(notification.id for notification in created)


def test_bad_cursor(client, login, make_user):
    """Bad cursor returns 400"""
    bob = make_user("bob")
    login(bob)

    response = client.get("/api/notifications?cursor=not-a-valid-cursor")

    assert response.status_code == 400


def test_list_ignores_household(db, client, login, make_user, make_notification):
    """Notifications are found by who they're for, not by household"""
    bob = make_user("bob")
    removed_note = make_notification(bob, type=NotificationType.MEMBER_REMOVED)
    bob.household_id = None
    db.session.commit()
    login(bob)

    response = client.get("/api/notifications")

    assert _ids(response) == [removed_note.id]


def test_list_item_shape(client, login, make_user, make_notification):
    """Each item has the expected shape"""
    bob = make_user("bob")
    note = make_notification(bob, entity_label="Dishes")
    login(bob)

    item = client.get("/api/notifications").get_json()["items"][0]

    assert set(item) == {
        "id", "recipientId", "householdId", "actor", "type", "entityType",
        "entityId", "entityLabel", "entityLabels", "eventMetadata",
        "count", "createdAt", "readAt",
    }

    assert item["type"] == "task_assigned"
    assert item["actor"] is None
    assert item["readAt"] is None