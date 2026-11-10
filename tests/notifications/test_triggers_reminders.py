from types import SimpleNamespace

import pytest

from app.extensions import db
from app.models import Reminder, ReminderAssignment, ReminderType
from app.models.notification import Notification, NotificationEntity, NotificationType

T = NotificationType


# ---- HELPERS ----

def count(user, type_):
    return Notification.query.filter_by(recipient_id=user.id, type=type_).count()


def create(client, household, assignees, message="Take out the trash", **extra):
    body = {"message": message, "assignedToIds": [u if isinstance(u, int) else u.id for u in assignees]}
    body.update(extra)
    return client.post(f"/api/households/{household.id}/reminders", json=body)      # MATCH


@pytest.fixture
def scene(make_user):
    return SimpleNamespace(alice=make_user("alice"), bob=make_user("bob"), carol=make_user("carol"))


# ---- REMINDER_ASSIGNED ----

def test_assignees_are_notified(client, login, household, scene):
    """Each person a reminder is set for is told, and nobody else"""
    login(scene.alice)

    response = create(client, household, [scene.bob, scene.carol])

    assert response.status_code == 201
    assert count(scene.bob, T.REMINDER_ASSIGNED) == 1
    assert count(scene.carol, T.REMINDER_ASSIGNED) == 1
    assert count(scene.alice, T.REMINDER_ASSIGNED) == 0


def test_self_reminder_is_silent(client, login, household, scene):
    """A reminder you set for yourself notifies no one"""
    login(scene.alice)

    create(client, household, [scene.alice])

    assert Notification.query.count() == 0


def test_self_and_other_tells_other_only(client, login, household, scene):
    """Setting a reminder for yourself and Bob tells Bob only"""
    login(scene.alice)

    create(client, household, [scene.alice, scene.bob])

    assert count(scene.bob, T.REMINDER_ASSIGNED) == 1
    assert Notification.query.count() == 1


def test_assigned_stores_fields(client, login, household, scene):
    """The notification points at the reminder and carries its message"""
    login(scene.alice)

    reminder_id = create(client, household, [scene.bob]).get_json()["id"]

    row = Notification.query.filter_by(recipient_id=scene.bob.id).one()
    assert row.entity_type == NotificationEntity.REMINDER
    assert row.entity_id == reminder_id
    assert row.entity_label == "Take out the trash"
    assert row.actor_id == scene.alice.id


def test_long_message_is_shortened(client, login, household, scene):
    """A long reminder message is cut down for the label"""
    login(scene.alice)

    create(client, household, [scene.bob], message="x" * 300)

    row = Notification.query.filter_by(recipient_id=scene.bob.id).one()
    assert len(row.entity_label) <= 80
    assert row.entity_label.endswith("…")


def test_two_reminders_fold(client, login, household, scene):
    """Two reminders for the same person in a row give one notification"""
    login(scene.alice)

    create(client, household, [scene.bob], message="Dishes")
    create(client, household, [scene.bob], message="Laundry")

    rows = Notification.query.filter_by(recipient_id=scene.bob.id).all()
    assert len(rows) == 1
    assert rows[0].count == 2


def test_no_assignees_is_silent(client, login, household, scene):
    """A reminder for nobody notifies no one"""
    login(scene.alice)

    response = create(client, household, [])

    assert response.status_code == 201
    assert Notification.query.count() == 0


def test_outsider_is_rejected(client, login, household, scene):
    """A user id outside the household is a 400, with no reminder and no notification"""
    login(scene.alice)

    response = create(client, household, [scene.bob.id, 999999])

    assert response.status_code == 400
    assert Reminder.query.count() == 0
    assert Notification.query.count() == 0


# ---- REMINDER UPDATES ----

def update(client, reminder_id, **payload):
    return client.patch(f"/api/reminders/{reminder_id}", json=payload)                # MATCH


def test_update_adds_notify(client, login, household, scene):
    """Adding someone to a reminder tells the new person, not the existing one"""
    login(scene.alice)
    reminder_id = create(client, household, [scene.bob]).get_json()["id"]

    response = update(client, reminder_id, assignedToIds=[scene.bob.id, scene.carol.id])

    assert response.status_code == 200
    assert count(scene.carol, T.REMINDER_ASSIGNED) == 1
    bob_row = Notification.query.filter_by(recipient_id=scene.bob.id).one()
    assert bob_row.count == 1    # from creating it, not from the update


def test_update_removal_silent(client, login, household, scene):
    """Taking someone off a reminder tells no one"""
    login(scene.alice)
    reminder_id = create(client, household, [scene.bob]).get_json()["id"]
    before = Notification.query.count()

    update(client, reminder_id, assignedToIds=[])

    assert Notification.query.count() == before


def test_update_self_add_silent(client, login, household, scene):
    """Adding yourself to your own reminder tells no one"""
    login(scene.alice)
    reminder_id = create(client, household, []).get_json()["id"]

    update(client, reminder_id, assignedToIds=[scene.alice.id])

    assert Notification.query.count() == 0


def test_update_message_only_silent(client, login, household, scene):
    """Editing only the message or date notifies no one"""
    login(scene.alice)
    reminder_id = create(client, household, [scene.bob]).get_json()["id"]
    before = Notification.query.count()

    update(client, reminder_id, reminderBody="Dishes instead", triggerDate="2026-12-01")

    assert Notification.query.count() == before


def test_update_outsider_rejected(client, login, household, scene):
    """A user id outside the household is a 400 and changes nothing"""
    login(scene.alice)
    reminder_id = create(client, household, [scene.bob]).get_json()["id"]
    before = Notification.query.count()

    response = update(client, reminder_id, reminderBody="Changed",
                      assignedToIds=[scene.bob.id, 999999])

    assert response.status_code == 400
    assert ReminderAssignment.query.filter_by(reminder_id=reminder_id).count() == 1
    assert Reminder.query.get(reminder_id).message == "Take out the trash"
    assert Notification.query.count() == before


def test_update_forbidden_silent(client, login, household, scene):
    """Only the creator can update a reminder, and a refused update tells no one"""
    reminder = Reminder(
        household_id=household.id,
        created_by_id=scene.alice.id,
        message="Take out the trash",
        reminder_type=ReminderType.CUSTOM,
        is_automatic=False,
    )
    db.session.add(reminder)
    db.session.commit()
    login(scene.bob)

    response = update(client, reminder.id, assignedToIds=[scene.bob.id, scene.carol.id])

    assert response.status_code == 403
    assert Notification.query.count() == 0