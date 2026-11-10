from types import SimpleNamespace

import pytest
from datetime import datetime
from app.models import Event
from app.models.notification import Notification, NotificationEntity, NotificationType

T = NotificationType

START = "2026-12-01T18:00:00Z"    # matches make_event's defaults
END = "2026-12-01T19:00:00Z"


# ---- HELPERS ----

def count(user, type_):
    return Notification.query.filter_by(recipient_id=user.id, type=type_).count()


def event_url(event, suffix=""):
    return f"/api/events/households/{event.household_id}/events/{event.id}{suffix}"


def create(client, household, **overrides):
    payload = {"title": "Picnic", "startUtc": START, "endUtc": END, "tzid": "UTC"}
    payload.update(overrides)
    return client.post(f"/api/events/households/{household.id}/events", json=payload)


def edit(client, event, **payload):
    return client.patch(event_url(event), json=payload)


def delete_event(client, event):
    return client.delete(event_url(event))


def unassign(client, event):
    return client.post(event_url(event, "/unassign"))


def exclude(client, event, occurrence):
    return client.post(event_url(event, "/exclude-occurrence"),
                       json={"occurrenceStart": occurrence})


@pytest.fixture
def scene(make_user, make_event):
    """alice made the event and attends with bob. carol is not attending."""
    alice = make_user("alice")
    bob = make_user("bob")
    carol = make_user("carol")
    event = make_event(alice, attendees=[alice, bob], title="Dinner")
    return SimpleNamespace(alice=alice, bob=bob, carol=carol, event=event)


# ---- EVENT_ASSIGNED ----

def test_create_notifies_attendees_but_not_creator(client, login, household, scene):
    """Creating an event tells everyone you invited, not yourself"""
    login(scene.alice)

    response = create(client, household, attendeeIds=[scene.alice.id, scene.bob.id, scene.carol.id])

    assert response.status_code == 201
    assert count(scene.bob, T.EVENT_ASSIGNED) == 1
    assert count(scene.carol, T.EVENT_ASSIGNED) == 1
    assert count(scene.alice, T.EVENT_ASSIGNED) == 0


def test_create_without_attendees_is_silent(client, login, household, scene):
    """With no attendees the creator is the only one, so nobody is told"""
    login(scene.alice)

    create(client, household)

    assert Notification.query.count() == 0


def test_adding_attendee_notifies_them(client, login, scene, admin):
    """Adding someone to an event tells them, and not the people already on it"""
    login(admin)

    response = edit(client, scene.event, attendeeIds=[scene.alice.id, scene.bob.id, scene.carol.id])

    assert response.status_code == 200
    assert count(scene.carol, T.EVENT_ASSIGNED) == 1
    assert count(scene.bob, T.EVENT_ASSIGNED) == 0


def test_assigned_stores_fields(client, login, scene):
    """The notification points at the event, with its title and who added the person"""
    login(scene.alice)

    edit(client, scene.event, attendeeIds=[scene.alice.id, scene.bob.id, scene.carol.id])

    row = Notification.query.filter_by(recipient_id=scene.carol.id, type=T.EVENT_ASSIGNED).one()
    assert row.entity_type == NotificationEntity.EVENT
    assert row.entity_id == scene.event.id
    assert row.entity_label == "Dinner"
    assert row.actor_id == scene.alice.id


def test_adding_yourself_is_silent(client, login, scene, admin):
    """An admin adding themselves to an event notifies no one"""
    login(admin)

    edit(client, scene.event, attendeeIds=[scene.alice.id, scene.bob.id, admin.id])

    assert Notification.query.count() == 0


def test_assigned_folds_across_events(client, login, household, scene):
    """Inviting the same person to two events in a row gives one notification"""
    login(scene.alice)

    create(client, household, title="Picnic", attendeeIds=[scene.carol.id])
    create(client, household, title="Hike", attendeeIds=[scene.carol.id])

    rows = Notification.query.filter_by(recipient_id=scene.carol.id, type=T.EVENT_ASSIGNED).all()
    assert len(rows) == 1
    assert rows[0].count == 2


def test_attendee_cannot_change_attendees(client, login, scene):
    """Only the creator or an admin can edit an event"""
    login(scene.bob)

    response = edit(client, scene.event, attendeeIds=[scene.alice.id, scene.bob.id, scene.carol.id])

    assert response.status_code == 403
    assert Notification.query.count() == 0


# ---- EVENT_UNASSIGNED ----

def test_removing_attendee_notifies_them(client, login, scene):
    """The person taken off an event is told"""
    login(scene.alice)

    edit(client, scene.event, attendeeIds=[scene.alice.id])

    assert count(scene.bob, T.EVENT_UNASSIGNED) == 1
    assert count(scene.alice, T.EVENT_UNASSIGNED) == 0


def test_keeping_attendees_is_silent(client, login, scene):
    """Saving the same attendees again notifies no one"""
    login(scene.alice)

    edit(client, scene.event, attendeeIds=[scene.alice.id, scene.bob.id])

    assert Notification.query.count() == 0


# ---- EVENT_SELF_UNASSIGNED ----

def test_unassigning_notifies_creator(client, login, scene):
    """An attendee leaving an event tells the creator, and the event stays"""
    login(scene.bob)

    response = unassign(client, scene.event)

    assert response.status_code == 200
    row = Notification.query.filter_by(recipient_id=scene.alice.id,
                                       type=T.EVENT_SELF_UNASSIGNED).one()
    assert row.actor_id == scene.bob.id
    assert row.entity_id == scene.event.id
    assert Event.query.get(scene.event.id) is not None
    assert count(scene.bob, T.EVENT_UNASSIGNED) == 0
    assert count(scene.alice, T.EVENT_UNASSIGNED) == 0


def test_creator_unassigning_is_silent(client, login, scene):
    """The creator taking themselves off their own event notifies no one"""
    login(scene.alice)

    response = unassign(client, scene.event)

    assert response.status_code == 200
    assert Notification.query.count() == 0


def test_non_attendee_cannot_unassign(client, login, scene):
    """Someone who isn't attending can't leave"""
    login(scene.carol)

    response = unassign(client, scene.event)

    assert response.status_code == 400
    assert Notification.query.count() == 0


def test_last_attendee_leaving_deletes_event_and_tells_creator(client, login, scene, make_event):
    """When the last attendee leaves, the event goes and the creator hears it was deleted"""
    event = make_event(scene.alice, attendees=[scene.bob], title="Solo")
    event_id = event.id
    login(scene.bob)

    response = unassign(client, event)

    assert response.status_code == 200
    assert Event.query.get(event_id) is None
    assert count(scene.alice, T.EVENT_DELETED) == 1
    assert count(scene.alice, T.EVENT_SELF_UNASSIGNED) == 0


def test_admin_removing_themselves_notifies_creator(client, login, scene, make_event, admin):
    """An admin who takes themselves off through an edit is a self-unassign too"""
    event = make_event(scene.alice, attendees=[scene.alice, scene.bob, admin])
    login(admin)

    edit(client, event, attendeeIds=[scene.alice.id, scene.bob.id])

    assert count(scene.alice, T.EVENT_SELF_UNASSIGNED) == 1
    assert count(scene.alice, T.EVENT_UNASSIGNED) == 0
    assert count(admin, T.EVENT_UNASSIGNED) == 0


# ---- EVENT_CHANGED ----

def test_change_by_admin_notifies_creator_and_attendees(client, login, scene, admin):
    """An admin editing an event tells its creator and its attendees, not outsiders"""
    login(admin)

    response = edit(client, scene.event, title="Dinner party")

    assert response.status_code == 200
    assert count(scene.alice, T.EVENT_CHANGED) == 1
    assert count(scene.bob, T.EVENT_CHANGED) == 1
    assert count(scene.carol, T.EVENT_CHANGED) == 0


def test_change_by_creator_notifies_attendees_only(client, login, scene):
    """When the creator edits, the creator isn't told"""
    login(scene.alice)

    edit(client, scene.event, title="Dinner party")

    assert count(scene.bob, T.EVENT_CHANGED) == 1
    assert count(scene.alice, T.EVENT_CHANGED) == 0


@pytest.mark.parametrize("payload", [
    {"title": "Dinner party"},
    {"rrule": "FREQ=WEEKLY"},
    {"startUtc": "2026-12-01T20:00:00Z", "endUtc": "2026-12-01T21:00:00Z"},
    {"date": "2026-12-02"},
])
def test_change_counts_title_time_and_recurrence(client, login, scene, payload):
    """Editing the title, the time, making it all-day or recurring counts as a change"""
    login(scene.alice)

    edit(client, scene.event, **payload)

    assert count(scene.bob, T.EVENT_CHANGED) == 1


@pytest.mark.parametrize("payload", [
    {"title": "Dinner"},                       # same value as before
    {"startUtc": START, "endUtc": END},        # same times as before
    {"visibility": "private"},
    {"allMembers": True},
])
def test_change_ignores_other_edits(client, login, scene, payload):
    """Saving the same values, or changing visibility or 'all members', is not a change"""
    login(scene.alice)

    edit(client, scene.event, **payload)

    assert Notification.query.count() == 0


def test_change_and_add_attendee_tells_new_one_assigned_only(client, login, scene):
    """Editing and adding someone at once: the new person hears 'assigned', not 'changed'"""
    login(scene.alice)

    edit(client, scene.event, title="Dinner party",
         attendeeIds=[scene.alice.id, scene.bob.id, scene.carol.id])

    assert count(scene.carol, T.EVENT_ASSIGNED) == 1
    assert count(scene.carol, T.EVENT_CHANGED) == 0
    assert count(scene.bob, T.EVENT_CHANGED) == 1


def test_change_and_remove_attendee_tells_removed_one_unassigned_only(client, login, scene):
    """Editing and removing someone at once: they hear 'unassigned', not 'changed'"""
    login(scene.alice)

    edit(client, scene.event, title="Dinner party", attendeeIds=[scene.alice.id])

    assert count(scene.bob, T.EVENT_UNASSIGNED) == 1
    assert count(scene.bob, T.EVENT_CHANGED) == 0


def test_repeated_edits_fold(client, login, scene):
    """Two edits of the same event in a row give one notification"""
    login(scene.alice)

    edit(client, scene.event, title="Dinner party")
    edit(client, scene.event, title="Dinner and games")

    assert Notification.query.filter_by(recipient_id=scene.bob.id,
                                        type=T.EVENT_CHANGED).count() == 1


def test_excluding_occurrence_notifies_attendees(client, login, scene, make_event, admin):
    """Cancelling one occurrence of a recurring event counts as a change"""
    event = make_event(scene.alice, attendees=[scene.alice, scene.bob], rrule="FREQ=WEEKLY")
    login(admin)

    response = exclude(client, event, "2026-12-08T18:00:00")

    assert response.status_code == 200
    assert count(scene.alice, T.EVENT_CHANGED) == 1
    assert count(scene.bob, T.EVENT_CHANGED) == 1


def test_excluding_from_non_recurring_event_is_silent(client, login, scene):
    """Excluding an occurrence of an event that doesn't repeat is refused"""
    login(scene.alice)

    response = exclude(client, scene.event, "2026-12-08T18:00:00")

    assert response.status_code == 400
    assert Notification.query.count() == 0


def test_change_forbidden_leaves_nothing(client, login, scene):
    """A refused edit notifies no one"""
    login(scene.carol)

    response = edit(client, scene.event, title="Mine now")

    assert response.status_code == 403
    assert Notification.query.count() == 0


# ---- EVENT_DELETED ----

def test_delete_by_admin_notifies_creator_and_attendees(client, login, scene, admin):
    """An admin deleting an event tells its creator and its attendees"""
    event_id = scene.event.id
    login(admin)

    response = delete_event(client, scene.event)

    assert response.status_code == 204
    assert Event.query.get(event_id) is None
    assert count(scene.alice, T.EVENT_DELETED) == 1
    assert count(scene.bob, T.EVENT_DELETED) == 1
    assert count(scene.carol, T.EVENT_DELETED) == 0


def test_delete_by_creator_notifies_attendees_only(client, login, scene):
    """When the creator deletes, only the attendees are told"""
    login(scene.alice)

    delete_event(client, scene.event)

    assert count(scene.bob, T.EVENT_DELETED) == 1
    assert count(scene.alice, T.EVENT_DELETED) == 0


def test_delete_stores_fields(client, login, scene):
    """The notification keeps the event's id and title after the event is gone"""
    event_id = scene.event.id
    login(scene.alice)

    delete_event(client, scene.event)

    row = Notification.query.filter_by(recipient_id=scene.bob.id, type=T.EVENT_DELETED).one()
    assert row.entity_type == NotificationEntity.EVENT
    assert row.entity_id == event_id
    assert row.entity_label == "Dinner"


def test_delete_two_events_folds(client, login, scene, make_event):
    """Deleting two events in a row tells the attendee once"""
    other = make_event(scene.alice, attendees=[scene.alice, scene.bob], title="Hike")
    login(scene.alice)

    delete_event(client, scene.event)
    delete_event(client, other)

    rows = Notification.query.filter_by(recipient_id=scene.bob.id, type=T.EVENT_DELETED).all()
    assert len(rows) == 1
    assert rows[0].count == 2


def test_delete_forbidden_leaves_nothing(client, login, scene):
    """A refused delete notifies no one"""
    login(scene.bob)    # attending, but neither the creator nor the admin

    response = delete_event(client, scene.event)

    assert response.status_code == 403
    assert Notification.query.count() == 0