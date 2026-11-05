import pytest
from app.models.notification import Notification, NotificationType, NotificationEntity
from app.services import NotificationService, RETENTION_DAYS
from datetime import datetime, timedelta, timezone

# Helpers
def _ids(response):
    return [item["id"] for item in response.get_json()["items"]]


# Tests

# GET /notifications
PROTECTED = [
    ("GET", "/api/notifications"),
    ("GET", "/api/notifications/unseen-count"),
    ("POST", "/api/notifications/seen"),
    ("POST", "/api/notifications/1/read"),
    ("POST", "/api/notifications/1/unread"),
    ("POST", "/api/notifications/read-all"),
]

@pytest.mark.parametrize("method, url", PROTECTED)
def test_requires_login(client, method, url):
    """Every notification endpoint rejects a request that is not logged in"""
    response = client.open(url, method=method)

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
    """Each listed notification has the documented keys, with values in the documented formats"""
    bob = make_user("bob")
    make_notification(bob)
    login(bob)

    item = client.get("/api/notifications").get_json()["items"][0]

    assert set(item) == {
        "id", "recipientId", "householdId", "actor", "type", "entityType",
        "entityId", "entityLabel", "entityLabels", "eventMetadata",
        "count", "createdAt", "readAt",
    }
    assert item["type"] == "task_assigned"
    assert item["entityType"] == "task"
    assert item["entityLabels"] == ["Dishes"]
    assert item["count"] == 1
    assert item["actor"] is None
    assert item["readAt"] is None
    assert datetime.fromisoformat(item["createdAt"]).tzinfo is not None


@pytest.mark.parametrize("limit, expected", [("0", 1), ("-5", 1), ("abc", 20)])
def test_list_bad_limit(client, login, make_user, make_notification, limit, expected):
    """A zero, negative or non-numeric limit is clamped instead of breaking the list"""
    bob = make_user("bob")
    for _ in range(25):
        make_notification(bob)
    login(bob)

    response = client.get(f"/api/notifications?limit={limit}")

    assert response.status_code == 200
    assert len(response.get_json()["items"]) == expected


def test_list_prunes(client, login, make_user, make_notification):
    """Loading the list deletes the user's notifications that were read long ago"""
    bob = make_user("bob")
    make_notification(bob, read_at=datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS + 1))
    make_notification(bob)   # unread: stays
    login(bob)

    items = client.get("/api/notifications").get_json()["items"]

    assert len(items) == 1


# GET /unseen-count
def test_unseen_counts_new(client, login, make_user, make_notification):
    """A user who has never opened notifications is counted for every unread notification"""
    alice = make_user("alice")
    bob = make_user("bob")
    make_notification(alice)
    make_notification(alice)
    make_notification(bob)

    login(alice)
    response = client.get("/api/notifications/unseen-count")

    assert response.status_code == 200
    assert response.get_json()["count"] == 2


def test_unseen_excludes_read(client, login, make_user, make_notification):
    """Notification already read is not counted"""
    alice = make_user("alice")
    make_notification(alice)
    make_notification(alice, read_at=datetime.now(timezone.utc))
    login(alice)

    response = client.get("/api/notifications/unseen-count")

    assert response.status_code == 200
    assert response.get_json()["count"] == 1


def test_unseen_only_mine(client, login, make_user, make_notification):
    """Unseen count is only for logged-in user"""
    alice = make_user("alice")
    bob = make_user("bob")
    make_notification(alice)
    make_notification(bob)

    login(alice)
    response = client.get("/api/notifications/unseen-count")

    assert response.status_code == 200
    assert response.get_json()["count"] == 1


def test_unseen_capped(client, login, make_user, make_notification):
    """The count stops at 21 (so the bell can show 20+ without counting everything)"""
    alice = make_user("alice")
    for _ in range(101):
        make_notification(alice)

    login(alice)
    response = client.get("/api/notifications/unseen-count")

    assert response.status_code == 200
    assert response.get_json()["count"] == 21



# POST /seen
def test_seen_sets_last_seen(client, login, db, make_user):
    """Opening notifications stores a newer last-seen time for the user"""
    alice = make_user("alice")
    alice.notifications_last_seen_at = datetime.now(timezone.utc) - timedelta(days=1)
    db.session.commit()
    db.session.refresh(alice)
    before = alice.notifications_last_seen_at
    login(alice)

    response = client.post("/api/notifications/seen")

    assert response.status_code == 200
    db.session.refresh(alice)
    assert alice.notifications_last_seen_at > before


def test_new_after_seen_counts(client, login, db, make_user, make_notification):
    """Notifications created after the last time the user opens notifications are counted"""
    alice = make_user("alice")
    seen_at = datetime.now(timezone.utc)
    alice.notifications_last_seen_at = seen_at
    db.session.commit()

    make_notification(alice, created_at=seen_at - timedelta(hours=1))
    make_notification(alice, created_at=seen_at + timedelta(hours=1))
    login(alice)

    response = client.get("/api/notifications/unseen-count")

    assert response.get_json()["count"] == 1


def test_seen_keeps_rows_unread(client, login, make_user, make_notification):
    """Opening notifications clears the badge but does not mark any notifications as read"""
    alice = make_user("alice")
    make_notification(alice)
    make_notification(alice)
    login(alice)

    response = client.post("/api/notifications/seen")

    items = client.get("/api/notifications").get_json()["items"]

    assert len(items) == 2
    assert all(item["readAt"] is None for item in items)



# POST /<notification_id>/read
def test_mark_read(client, login, make_user, make_notification):
    """Marking a notification as read sets its read_at"""
    alice = make_user("alice")
    notification = make_notification(alice)
    login(alice)

    response = client.post(f"/api/notifications/{notification.id}/read")

    assert response.status_code == 200
    assert response.get_json()["readAt"] is not None


def test_mark_read_twice_keeps_original(client, login, make_user, make_notification):
    """Marking a notification as read twice keeps the original read_at"""
    alice = make_user("alice")
    notification = make_notification(alice)
    login(alice)
    url = f"/api/notifications/{notification.id}/read"

    first = client.post(url).get_json()["readAt"]
    second = client.post(url).get_json()["readAt"]

    assert first is not None
    assert first == second


# POST /<notification_id>/unread
def test_mark_unread(client, login, make_user, make_notification):
    """Marking a notification as unread clears its read_at"""
    alice = make_user("alice")
    notification = make_notification(alice, read_at=datetime.now(timezone.utc))
    login(alice)

    response = client.post(f"/api/notifications/{notification.id}/unread")

    assert response.status_code == 200
    assert response.get_json()["readAt"] is None


@pytest.mark.parametrize("action", ["read", "unread"])
def test_mark_read_missing_404(client, login, make_user, action):
    """Changing the read state for a notification that does not exist returns a 404"""
    alice = make_user("alice")
    login(alice)

    response = client.post(f"/api/notifications/999/{action}")

    assert response.status_code == 404

@pytest.mark.parametrize("action", ["read", "unread"])
def test_mark_read_other_users_404(client, login, make_user, make_notification, action):
    """A user cannot change another user's notification, and cannot tell that it exists"""
    alice = make_user("alice")
    bob = make_user("bob")
    notification = make_notification(bob)
    login(alice)

    response = client.post(f"/api/notifications/{notification.id}/{action}")

    assert response.status_code == 404


# POST /read-all
def test_mark_all_read(client, login, make_user, make_notification):
    """Marking all notifications as read sets their read_at"""
    bob = make_user("bob")
    make_notification(bob)
    make_notification(bob)
    make_notification(bob, read_at=datetime.now(timezone.utc))   # already read: not counted
    login(bob)

    response = client.post("/api/notifications/read-all")

    assert response.status_code == 200
    assert response.get_json()["updated"] == 2
    items = client.get("/api/notifications").get_json()["items"]
    assert len(items) == 3
    assert all(item["readAt"] is not None for item in items)


def test_mark_all_read_leaves_others(client, login, db, make_user, make_notification):
    """Mark all read never touches another user's notifications"""
    alice = make_user("alice")
    bob = make_user("bob")
    alices = make_notification(alice)
    make_notification(bob)
    login(bob)

    client.post("/api/notifications/read-all")

    db.session.refresh(alices)       # the request ran in its own session
    assert alices.read_at is None


@pytest.mark.parametrize("limit, expected", [("0", 1), ("-5", 1), ("abc", 20)])
def test_list_bad_limit(client, login, make_user, make_notification, limit, expected):
    """A zero, negative or non-numeric limit is clamped instead of breaking the list"""
    bob = make_user("bob")
    for _ in range(25):
        make_notification(bob)
    login(bob)

    response = client.get(f"/api/notifications?limit={limit}")

    assert response.status_code == 200
    assert len(response.get_json()["items"]) == expected