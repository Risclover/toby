from types import SimpleNamespace

import re
import pytest

from app.extensions import db
from app.models import ShoppingList, ShoppingListMember


# ---- HELPERS ----

def add_member(shopping_list, user):
    db.session.add(ShoppingListMember(list_id=shopping_list.id, user_id=user.id))
    db.session.commit()


def get_list(client, shopping_list):
    return client.get(f"/api/shopping-lists/{shopping_list.id}")                      # MATCH


def get_lists(client, household_id):
    return client.get(f"/api/shopping-lists?householdId={household_id}")              # MATCH


def add_item(client, shopping_list, **payload):
    return client.post(f"/api/shopping-lists/{shopping_list.id}/items", json=payload) # MATCH


def duplicate(client, shopping_list):
    return client.post(f"/api/shopping-lists/{shopping_list.id}/duplicate")           # MATCH


@pytest.fixture
def scene(make_user, make_shopping_list):
    """alice made three lists: one for everyone, one shared with bob, one only she can see.
    carol is in the household but is on none of the restricted lists."""
    alice = make_user("alice")
    bob = make_user("bob")
    carol = make_user("carol")
    everyone = make_shopping_list(alice, all_members=True, title="Pantry")
    shared = make_shopping_list(alice, all_members=False, title="Costco")
    add_member(shared, bob)
    private = make_shopping_list(alice, all_members=False, title="Surprise gift")
    return SimpleNamespace(alice=alice, bob=bob, carol=carol,
                           everyone=everyone, shared=shared, private=private)


# ---- READING ----

def test_everyone_list_is_visible_to_all(client, login, scene):
    """Anyone in the household can open a list that everyone has"""
    login(scene.carol)

    assert get_list(client, scene.everyone).status_code == 200


def test_member_can_open_shared_list(client, login, scene):
    """A member can open a restricted list they are on"""
    login(scene.bob)

    assert get_list(client, scene.shared).status_code == 200


def test_non_member_cannot_open_restricted_list(client, login, scene):
    """Someone who isn't on a restricted list gets 'not found'"""
    login(scene.carol)

    assert get_list(client, scene.shared).status_code == 404


def test_creator_can_open_their_private_list(client, login, scene):
    """The creator can always open their own list"""
    login(scene.alice)

    assert get_list(client, scene.private).status_code == 200


def test_admin_can_open_shared_but_not_private(client, login, scene, admin):
    """The admin sees restricted lists that other people share, but not private ones"""
    login(admin)

    assert get_list(client, scene.shared).status_code == 200
    assert get_list(client, scene.private).status_code == 404


def test_list_endpoint_only_returns_visible_lists(client, login, household, scene):
    """The household's list shows only what the viewer can see"""
    login(scene.carol)

    titles = {row["title"] for row in get_lists(client, household.id).get_json()}

    assert titles == {"Pantry"}


def test_list_endpoint_for_bob_includes_shared(client, login, household, scene):
    """A member sees the lists for everyone plus the ones they are on"""
    login(scene.bob)

    titles = {row["title"] for row in get_lists(client, household.id).get_json()}

    assert titles == {"Pantry", "Costco"}


def test_list_endpoint_refuses_other_households(client, login, household, scene):
    """You can't list another household's shopping lists"""
    login(scene.alice)

    assert get_lists(client, household.id + 999).status_code == 403


# ---- ITEMS ----

def test_member_can_add_item(client, login, scene):
    """A member can add items to a list they can see"""
    login(scene.bob)

    response = add_item(client, scene.shared, name="Milk")

    assert response.status_code == 201


def test_non_member_cannot_add_item(client, login, scene):
    """Someone without access can't add items, and nothing is created"""
    login(scene.carol)

    response = add_item(client, scene.shared, name="Milk")

    assert response.status_code == 404
    assert db.session.query(ShoppingList).get(scene.shared.id).items == []


def test_add_item_requires_a_name(client, login, scene):
    """A missing or blank name is a 400, not a crash"""
    login(scene.alice)

    assert add_item(client, scene.everyone).status_code == 400
    assert add_item(client, scene.everyone, name="   ").status_code == 400


# ---- MANAGING ----

def test_admin_cannot_manage_private_list(client, login, scene, admin):
    """The admin can't rename or delete a list only its creator can see"""
    login(admin)

    rename = client.patch(f"/api/shopping-lists/{scene.private.id}",                  # MATCH
                          json={"title": "Mine now"})
    delete = client.delete(f"/api/shopping-lists/{scene.private.id}")                 # MATCH

    assert rename.status_code == 404
    assert delete.status_code == 404
    assert ShoppingList.query.get(scene.private.id).title == "Surprise gift"


def test_creator_can_manage_private_list(client, login, scene):
    """The creator can still edit their own private list"""
    login(scene.alice)

    response = client.patch(f"/api/shopping-lists/{scene.private.id}",                # MATCH
                            json={"title": "Gift ideas"})

    assert response.status_code == 200


def test_member_can_see_but_not_manage(client, login, scene):
    """A member who can see a list but didn't make it gets 403 when they try to change it"""
    login(scene.bob)

    response = client.delete(f"/api/shopping-lists/{scene.shared.id}")                # MATCH

    assert response.status_code == 403


def test_non_member_cannot_manage_restricted_list(client, login, scene):
    """Someone with no access gets 'not found', not 'forbidden'"""
    login(scene.carol)

    response = client.patch(f"/api/shopping-lists/{scene.shared.id}", json={"title": "Mine now"})

    assert response.status_code == 404


# ---- DUPLICATING ----

def test_creator_can_duplicate_own_restricted_list(client, login, scene):
    """The creator of a restricted list can duplicate it even if they aren't a member"""
    login(scene.alice)

    response = duplicate(client, scene.shared)

    assert response.status_code == 201, response.get_json()


def test_duplicate_belongs_to_whoever_duplicated(client, login, scene):
    """The copy's creator is the person who made the copy"""
    login(scene.bob)

    response = duplicate(client, scene.shared)

    assert response.status_code == 201
    assert response.get_json()["creatorId"] == scene.bob.id


def test_non_member_cannot_duplicate(client, login, scene):
    """Someone without access gets 'not found', not a server error"""
    login(scene.carol)

    response = duplicate(client, scene.shared)

    assert response.status_code == 404


def test_duplicate_of_missing_list_is_404(client, login, scene):
    """A list that doesn't exist is a 404 rather than a 500"""
    login(scene.alice)

    response = client.post("/api/shopping-lists/999999/duplicate")                    # MATCH

    assert response.status_code == 404


# ---- HOUSEHOLD ROUTES ----

def household_lists(client, household):
    return client.get(f"/api/households/{household.id}/shopping")                     # MATCH


def household_list(client, household, shopping_list):
    return client.get(f"/api/households/{household.id}/shopping/{shopping_list.id}")  # MATCH


def test_household_endpoint_hides_private_list_from_admin(client, login, household, scene, admin):
    """The admin sees shared restricted lists but not a creator-only one"""
    login(admin)

    titles = {row["title"] for row in household_lists(client, household).get_json()}

    assert titles == {"Pantry", "Costco"}


def test_household_endpoint_filters_for_non_member(client, login, household, scene):
    """Someone on no restricted list sees only the lists for everyone"""
    login(scene.carol)

    titles = {row["title"] for row in household_lists(client, household).get_json()}

    assert titles == {"Pantry"}


def test_household_single_list_hidden_from_non_member(client, login, household, scene):
    """A restricted list you aren't on looks like it doesn't exist"""
    login(scene.carol)

    assert household_list(client, household, scene.shared).status_code == 404


def test_household_single_list_hidden_from_admin_when_private(client, login, household, scene, admin):
    """The admin can't open a creator-only list by id"""
    login(admin)

    assert household_list(client, household, scene.private).status_code == 404


def test_household_single_list_open_to_member(client, login, household, scene):
    """A member can open a restricted list they are on"""
    login(scene.bob)

    assert household_list(client, household, scene.shared).status_code == 200