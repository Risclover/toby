from types import SimpleNamespace

import pytest

from app.extensions import db
from app.models import Tasklist, TasklistMember


# ---- HELPERS ----

def add_member(tasklist, user):
    db.session.add(TasklistMember(tasklist_id=tasklist.id, user_id=user.id))
    db.session.commit()


def household_lists(client, household):
    return client.get(f"/api/households/{household.id}/tasklists")


@pytest.fixture
def scene(make_user, make_tasklist):
    """alice made a list shared with bob and one only she can see."""
    alice = make_user("alice")
    bob = make_user("bob")
    shared = make_tasklist(alice, all_members=False, title="Chores")
    add_member(shared, bob)
    private = make_tasklist(alice, all_members=False, title="Surprise party")
    return SimpleNamespace(alice=alice, bob=bob, shared=shared, private=private)


# ---- VISIBILITY ----

def test_admin_does_not_see_private_list(client, login, household, scene, admin):
    """The admin's list of tasklists leaves out a creator-only list"""
    login(admin)

    titles = {row["title"] for row in household_lists(client, household).get_json()}

    assert titles == {"Chores"}


def test_creator_sees_private_list(client, login, household, scene):
    """The creator still sees their own private list"""
    login(scene.alice)

    titles = {row["title"] for row in household_lists(client, household).get_json()}

    assert titles == {"Chores", "Surprise party"}


def test_member_sees_only_their_lists(client, login, household, scene):
    """A member sees the list they are on and not the private one"""
    login(scene.bob)

    titles = {row["title"] for row in household_lists(client, household).get_json()}

    assert titles == {"Chores"}


# ---- MANAGING ----

def test_admin_cannot_rename_private_list(client, login, scene, admin):
    """The admin can't edit a list only its creator can see"""
    login(admin)

    response = client.put(f"/api/tasklists/{scene.private.id}",json={"title": "Mine now"})

    assert response.status_code == 403
    assert Tasklist.query.get(scene.private.id).title == "Surprise party"


def test_admin_cannot_delete_private_list(client, login, scene, admin):
    """The admin can't delete a list only its creator can see"""
    login(admin)

    response = client.delete(f"/api/tasklists/{scene.private.id}")
    assert response.status_code == 403
    assert Tasklist.query.get(scene.private.id) is not None


def test_admin_can_still_manage_shared_list(client, login, scene, admin):
    """A restricted list with other members is still the admin's to manage"""
    login(admin)

    response = client.put(f"/api/tasklists/{scene.shared.id}", json={"title": "House chores"})

    assert response.status_code == 200


def test_creator_can_manage_private_list(client, login, scene):
    """The creator can still edit their own private list"""
    login(scene.alice)

    response = client.put(f"/api/tasklists/{scene.private.id}", json={"title": "Party plans"})

    assert response.status_code == 200


def test_creator_can_duplicate_own_restricted_list(client, login, scene):
    """The creator of a restricted list can duplicate it even if they aren't a member"""
    login(scene.alice)

    response = client.post(f"/api/tasklists/{scene.shared.id}/duplicate")
    assert response.status_code == 201