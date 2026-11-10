from types import SimpleNamespace

import pytest

from app.models import Announcement
from app.models.notification import Notification, NotificationEntity, NotificationType

T = NotificationType


# ---- HELPERS ----

def count(user, type_):
    return Notification.query.filter_by(recipient_id=user.id, type=type_).count()


def delete(client, announcement):
    return client.delete(f"/api/announcements/{announcement.id}")                     # MATCH


def toggle(client, announcement):
    return client.put(f"/api/announcements/{announcement.id}/importance")             # MATCH


def set_importance(client, announcement, value):
    return client.put(f"/api/announcements/{announcement.id}",                        # MATCH
                      json={"isImportant": value})


@pytest.fixture
def scene(make_user, make_announcement):
    """alice posted an announcement, bob is a plain member."""
    alice = make_user("alice")
    bob = make_user("bob")
    return SimpleNamespace(alice=alice, bob=bob, post=make_announcement(alice))


# ---- ANNOUNCEMENT_DELETED ----

def test_admin_delete_notifies_author(client, login, scene, admin):
    """When the admin deletes an announcement, its author is told"""
    post_id = scene.post.id
    login(admin)

    response = delete(client, scene.post)

    assert response.status_code == 204
    assert Announcement.query.get(post_id) is None
    assert count(scene.alice, T.ANNOUNCEMENT_DELETED) == 1
    assert count(scene.bob, T.ANNOUNCEMENT_DELETED) == 0


def test_author_delete_is_silent(client, login, scene):
    """Deleting your own announcement notifies no one"""
    login(scene.alice)

    delete(client, scene.post)

    assert Notification.query.count() == 0


def test_delete_stores_fields(client, login, scene, admin):
    """The notification keeps the announcement's id and message after it's gone"""
    post_id = scene.post.id
    login(admin)

    delete(client, scene.post)

    row = Notification.query.filter_by(recipient_id=scene.alice.id).one()
    assert row.entity_type == NotificationEntity.ANNOUNCEMENT
    assert row.entity_id == post_id
    assert row.entity_label == "Trash day moved to Friday"
    assert row.actor_id == admin.id


def test_delete_shortens_long_message(client, login, make_announcement, scene, admin):
    """A long announcement is cut down for the label"""
    long_post = make_announcement(scene.alice, message="x" * 300)
    login(admin)

    delete(client, long_post)

    row = Notification.query.filter_by(recipient_id=scene.alice.id).one()
    assert len(row.entity_label) <= 80
    assert row.entity_label.endswith("…")


def test_two_deletes_fold(client, login, make_announcement, scene, admin):
    """Deleting two of the author's announcements in a row tells them once"""
    second = make_announcement(scene.alice, message="Pizza night")
    login(admin)

    delete(client, scene.post)
    delete(client, second)

    rows = Notification.query.filter_by(recipient_id=scene.alice.id).all()
    assert len(rows) == 1
    assert rows[0].count == 2


def test_delete_forbidden_is_silent(client, login, scene):
    """A member who isn't the author or admin can't delete, and nobody is told"""
    login(scene.bob)

    response = delete(client, scene.post)

    assert response.status_code == 403
    assert Notification.query.count() == 0


# ---- ANNOUNCEMENT_EDITED ----

def test_admin_toggle_notifies_author(client, login, scene, admin):
    """When the admin changes an announcement's importance, its author is told"""
    login(admin)

    response = toggle(client, scene.post)

    assert response.status_code == 200
    row = Notification.query.filter_by(recipient_id=scene.alice.id,
                                       type=T.ANNOUNCEMENT_EDITED).one()
    assert row.entity_type == NotificationEntity.ANNOUNCEMENT
    assert row.entity_id == scene.post.id
    assert row.entity_label == "Trash day moved to Friday"
    assert row.actor_id == admin.id


def test_author_toggle_is_silent(client, login, scene):
    """Changing the importance of your own announcement notifies no one"""
    login(scene.alice)

    toggle(client, scene.post)

    assert Notification.query.count() == 0


def test_author_put_is_silent(client, login, scene):
    """The author setting importance through the PUT route notifies no one"""
    login(scene.alice)

    set_importance(client, scene.post, True)

    assert Notification.query.count() == 0


def test_member_toggle_forbidden(client, login, scene):
    """A member who isn't the author or admin can't toggle, and nobody is told"""
    login(scene.bob)

    response = toggle(client, scene.post)

    assert response.status_code == 403
    assert Notification.query.count() == 0


def test_repeated_toggles_fold(client, login, scene, admin):
    """The admin toggling the same announcement twice leaves the author one notification, not two"""
    login(admin)

    toggle(client, scene.post)
    toggle(client, scene.post)

    rows = Notification.query.filter_by(recipient_id=scene.alice.id).all()
    assert len(rows) == 1
    assert rows[0].count == 1


# ---- NEW ANNOUNCEMENTS ----

def test_posting_is_silent(client, login, household, scene):
    """A new announcement notifies no one; the dashboard badge covers it"""
    login(scene.alice)

    response = client.post("/api/announcements",json={"householdId": household.id, "message": "Hi all"})

    assert response.status_code == 201
    assert Notification.query.count() == 0