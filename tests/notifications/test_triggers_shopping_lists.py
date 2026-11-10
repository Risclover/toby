from types import SimpleNamespace

import pytest

from app.extensions import db
from app.models import ShoppingList, ShoppingListMember
from app.models.notification import Notification, NotificationEntity, NotificationType

T = NotificationType


# ---- HELPERS ----

def add_member(shopping_list, user):
    db.session.add(ShoppingListMember(list_id=shopping_list.id, user_id=user.id))
    db.session.commit()


def count(user, type_):
    return Notification.query.filter_by(recipient_id=user.id, type=type_).count()


def set_members(client, shopping_list, user_ids):
    return client.patch(f"/api/shopping-lists/{shopping_list.id}/assigned-members",   # MATCH
                        json={"members": list(user_ids)})


def edit(client, shopping_list, **payload):
    return client.patch(f"/api/shopping-lists/{shopping_list.id}", json=payload)      # MATCH


def delete_list(client, shopping_list):
    return client.delete(f"/api/shopping-lists/{shopping_list.id}")                   # MATCH


def leave(client, shopping_list):
    return client.post(f"/api/shopping-lists/{shopping_list.id}/leave")               # MATCH


def duplicate(client, shopping_list):
    return client.post(f"/api/shopping-lists/{shopping_list.id}/duplicate")           # MATCH


def create_list(client, household, **payload):
    body = {"title": "Costco", "color": "#15aabf"}
    body.update(payload)
    return client.post(f"/api/households/{household.id}/shopping-lists", json=body)  # MATCH


@pytest.fixture
def scene(make_user, make_shopping_list):
    """alice made a restricted list, bob is a member, carol has no access."""
    alice = make_user("alice")
    bob = make_user("bob")
    carol = make_user("carol")
    shopping_list = make_shopping_list(alice, all_members=False)
    add_member(shopping_list, bob)
    return SimpleNamespace(alice=alice, bob=bob, carol=carol, shopping_list=shopping_list)


# ---- SHOPPING_LIST_ASSIGNED ----

def test_add_member_notifies(client, login, scene):
    """The person added to a list is told, and the existing members are not"""
    login(scene.alice)

    response = set_members(client, scene.shopping_list, [scene.bob.id, scene.carol.id])

    assert response.status_code == 200
    assert count(scene.carol, T.SHOPPING_LIST_ASSIGNED) == 1
    assert count(scene.bob, T.SHOPPING_LIST_ASSIGNED) == 0


def test_add_member_via_edit(client, login, scene):
    """Adding someone through the general edit endpoint works the same way"""
    login(scene.alice)

    edit(client, scene.shopping_list, memberIds=[scene.bob.id, scene.carol.id])

    assert count(scene.carol, T.SHOPPING_LIST_ASSIGNED) == 1


def test_assigned_stores_fields(client, login, scene):
    """The notification points at the list, with its title and who added the person"""
    login(scene.alice)

    set_members(client, scene.shopping_list, [scene.bob.id, scene.carol.id])

    row = Notification.query.filter_by(recipient_id=scene.carol.id,
                                       type=T.SHOPPING_LIST_ASSIGNED).one()
    assert row.entity_type == NotificationEntity.SHOPPING_LIST
    assert row.entity_id == scene.shopping_list.id
    assert row.entity_label == scene.shopping_list.title
    assert row.actor_id == scene.alice.id


def test_adding_yourself_is_silent(client, login, scene, admin):
    """An admin adding themselves to a list notifies no one"""
    login(admin)

    set_members(client, scene.shopping_list, [scene.bob.id, admin.id])

    assert Notification.query.count() == 0


def test_open_to_everyone_notifies(client, login, household, scene):
    """Opening a list to the whole household tells the people who didn't have it"""
    login(scene.alice)

    set_members(client, scene.shopping_list, [u.id for u in household.members])

    assert count(scene.carol, T.SHOPPING_LIST_ASSIGNED) == 1
    assert count(scene.bob, T.SHOPPING_LIST_ASSIGNED) == 0
    assert count(scene.alice, T.SHOPPING_LIST_ASSIGNED) == 0


def test_assigned_folds_across_lists(client, login, scene, make_shopping_list):
    """Adding the same person to two lists in a row gives one notification"""
    costco = make_shopping_list(scene.alice, all_members=False, title="Costco")
    login(scene.alice)

    set_members(client, scene.shopping_list, [scene.bob.id, scene.carol.id])
    set_members(client, costco, [scene.carol.id])

    rows = Notification.query.filter_by(recipient_id=scene.carol.id,
                                        type=T.SHOPPING_LIST_ASSIGNED).all()
    assert len(rows) == 1
    assert rows[0].count == 2


def test_member_cannot_add_people(client, login, scene):
    """Only the creator or an admin can change who is on a list"""
    login(scene.bob)

    response = set_members(client, scene.shopping_list, [scene.bob.id, scene.carol.id])

    assert response.status_code == 403
    assert Notification.query.count() == 0


def test_create_subset_notifies(client, login, household, scene):
    """A new list for chosen people tells those people, not the creator or anyone else"""
    login(scene.alice)

    response = create_list(client, household, allMembers=False,
                           memberIds=[scene.alice.id, scene.bob.id])

    assert response.status_code == 201
    assert count(scene.bob, T.SHOPPING_LIST_ASSIGNED) == 1
    assert count(scene.alice, T.SHOPPING_LIST_ASSIGNED) == 0
    assert count(scene.carol, T.SHOPPING_LIST_ASSIGNED) == 0


def test_create_everyone_silent(client, login, household, scene):
    """A list for the whole household notifies no one"""
    login(scene.alice)

    create_list(client, household, allMembers=True)

    assert Notification.query.count() == 0


def test_create_invalid_silent(client, login, household, scene):
    """A refused creation notifies no one"""
    login(scene.alice)

    response = create_list(client, household, allMembers=False, memberIds=[])

    assert response.status_code == 400
    assert Notification.query.count() == 0


def test_duplicate_subset_notifies(client, login, scene, admin):
    """Duplicating a restricted list tells the people copied onto it"""
    login(admin)

    response = duplicate(client, scene.shopping_list)

    assert response.status_code == 201
    row = Notification.query.filter_by(recipient_id=scene.bob.id,
                                       type=T.SHOPPING_LIST_ASSIGNED).one()
    assert row.entity_id == response.get_json()["id"]


def test_duplicate_everyone_silent(client, login, make_shopping_list, scene, admin):
    """Duplicating a household-wide list notifies no one"""
    everyone = make_shopping_list(scene.alice, all_members=True, title="Pantry")
    login(admin)

    duplicate(client, everyone)

    assert Notification.query.count() == 0


# ---- SHOPPING_LIST_UNASSIGNED ----

def test_remove_member_notifies(client, login, scene):
    """The person taken off a list is told"""
    login(scene.alice)

    set_members(client, scene.shopping_list, [])

    assert count(scene.bob, T.SHOPPING_LIST_UNASSIGNED) == 1
    assert count(scene.alice, T.SHOPPING_LIST_UNASSIGNED) == 0


def test_remove_member_via_edit(client, login, scene):
    """Removing someone through the general edit endpoint works the same way"""
    login(scene.alice)

    edit(client, scene.shopping_list, memberIds=[])

    assert count(scene.bob, T.SHOPPING_LIST_UNASSIGNED) == 1


def test_keeping_member_is_silent(client, login, scene):
    """Saving the same members again notifies no one"""
    login(scene.alice)

    set_members(client, scene.shopping_list, [scene.bob.id])

    assert Notification.query.count() == 0


def test_restrict_notifies_dropped(
    client, login, make_shopping_list, scene
):
    """Narrowing an everyone list tells the people who lose it, not the ones who keep it"""
    everyone = make_shopping_list(scene.alice, all_members=True, title="Pantry")
    login(scene.alice)

    set_members(client, everyone, [scene.bob.id])

    assert count(scene.carol, T.SHOPPING_LIST_UNASSIGNED) == 1
    assert count(scene.bob, T.SHOPPING_LIST_UNASSIGNED) == 0
    assert count(scene.alice, T.SHOPPING_LIST_UNASSIGNED) == 0


def test_add_remove_add_folds(client, login, scene):
    """Adding, removing and re-adding the same member leaves them with one notification"""
    login(scene.alice)

    set_members(client, scene.shopping_list, [scene.bob.id, scene.carol.id])
    set_members(client, scene.shopping_list, [scene.bob.id])
    set_members(client, scene.shopping_list, [scene.bob.id, scene.carol.id])

    rows = Notification.query.filter_by(recipient_id=scene.carol.id).all()
    assert [row.type for row in rows] == [T.SHOPPING_LIST_ASSIGNED]


# ---- SHOPPING_LIST_SELF_UNASSIGNED ----

def test_leaving_notifies_creator(client, login, scene):
    """A member leaving a list tells the creator"""
    login(scene.bob)

    response = leave(client, scene.shopping_list)

    assert response.status_code == 200
    row = Notification.query.filter_by(recipient_id=scene.alice.id,
                                       type=T.SHOPPING_LIST_SELF_UNASSIGNED).one()
    assert row.actor_id == scene.bob.id
    assert row.entity_id == scene.shopping_list.id


def test_leave_removes_member(client, login, scene):
    """Leaving takes the person off the list and sends no 'unassigned' to anyone"""
    login(scene.bob)

    leave(client, scene.shopping_list)

    assert ShoppingListMember.query.filter_by(list_id=scene.shopping_list.id,
                                              user_id=scene.bob.id).count() == 0
    assert count(scene.bob, T.SHOPPING_LIST_UNASSIGNED) == 0
    assert count(scene.alice, T.SHOPPING_LIST_UNASSIGNED) == 0


def test_creator_cannot_leave(client, login, scene):
    """You can't leave a list you created"""
    login(scene.alice)

    response = leave(client, scene.shopping_list)

    assert response.status_code == 400
    assert Notification.query.count() == 0


def test_non_member_cannot_leave(client, login, scene):
    """Someone who isn't on the list can't leave it"""
    login(scene.carol)

    response = leave(client, scene.shopping_list)

    assert response.status_code == 404
    assert Notification.query.count() == 0


def test_cannot_leave_everyone_list(client, login, make_shopping_list, scene):
    """A list everybody has can't be left"""
    everyone = make_shopping_list(scene.alice, all_members=True, title="Pantry")
    login(scene.bob)

    response = leave(client, everyone)

    assert response.status_code == 400
    assert Notification.query.count() == 0


def test_admin_self_remove_notifies(client, login, scene, admin):
    """An admin who takes themselves off through an edit is a self-unassign too"""
    add_member(scene.shopping_list, admin)
    login(admin)

    set_members(client, scene.shopping_list, [scene.bob.id])

    assert count(scene.alice, T.SHOPPING_LIST_SELF_UNASSIGNED) == 1
    assert count(scene.alice, T.SHOPPING_LIST_UNASSIGNED) == 0
    assert count(admin, T.SHOPPING_LIST_UNASSIGNED) == 0


# ---- SHOPPING_LIST_CHANGED ----

def test_rename_by_admin(client, login, scene, admin):
    """An admin renaming a list tells its creator and its members, not outsiders"""
    login(admin)

    response = edit(client, scene.shopping_list, title="Weekend shop")

    assert response.status_code == 200
    assert count(scene.alice, T.SHOPPING_LIST_CHANGED) == 1
    assert count(scene.bob, T.SHOPPING_LIST_CHANGED) == 1
    assert count(scene.carol, T.SHOPPING_LIST_CHANGED) == 0


def test_rename_by_creator(client, login, scene):
    """When the creator renames, only the members are told"""
    login(scene.alice)

    edit(client, scene.shopping_list, title="Weekend shop")

    assert count(scene.bob, T.SHOPPING_LIST_CHANGED) == 1
    assert count(scene.alice, T.SHOPPING_LIST_CHANGED) == 0


def test_rename_stores_new_title(client, login, scene):
    """The notification carries the new title"""
    login(scene.alice)

    edit(client, scene.shopping_list, title="Weekend shop")

    row = Notification.query.filter_by(recipient_id=scene.bob.id,
                                       type=T.SHOPPING_LIST_CHANGED).one()
    assert row.entity_type == NotificationEntity.SHOPPING_LIST
    assert row.entity_id == scene.shopping_list.id
    assert row.entity_label == "Weekend shop"


def test_rename_everyone_list(client, login, make_shopping_list, scene):
    """Renaming a list the whole household can see tells everyone but the actor"""
    everyone = make_shopping_list(scene.alice, all_members=True, title="Pantry")
    login(scene.alice)

    edit(client, everyone, title="Pantry stock")

    assert count(scene.bob, T.SHOPPING_LIST_CHANGED) == 1
    assert count(scene.carol, T.SHOPPING_LIST_CHANGED) == 1


def test_same_title_is_silent(client, login, scene):
    """Saving the title it already has notifies no one"""
    login(scene.alice)

    edit(client, scene.shopping_list, title=scene.shopping_list.title)

    assert Notification.query.count() == 0


def test_other_settings_are_silent(client, login, scene):
    """Changing the color or the display options is not a change worth a notification"""
    login(scene.alice)

    edit(client, scene.shopping_list, color="#fa5252")
    client.patch(f"/api/shopping-lists/{scene.shopping_list.id}/options",             # MATCH
                 json={"defaultSort": "alpha", "groupByCategory": False})

    assert Notification.query.count() == 0


def test_rename_and_add_member(client, login, scene):
    """Renaming and adding someone in one save: the new person hears 'assigned', not 'changed'"""
    login(scene.alice)

    edit(client, scene.shopping_list, title="Weekend shop",
         memberIds=[scene.bob.id, scene.carol.id])

    assert count(scene.carol, T.SHOPPING_LIST_ASSIGNED) == 1
    assert count(scene.carol, T.SHOPPING_LIST_CHANGED) == 0
    assert count(scene.bob, T.SHOPPING_LIST_CHANGED) == 1


def test_rename_and_remove_member(client, login, scene):
    """Renaming and removing someone in one save: they hear 'unassigned', not 'changed'"""
    login(scene.alice)

    edit(client, scene.shopping_list, title="Weekend shop", memberIds=[])

    assert count(scene.bob, T.SHOPPING_LIST_UNASSIGNED) == 1
    assert count(scene.bob, T.SHOPPING_LIST_CHANGED) == 0


def test_repeated_renames_fold(client, login, scene):
    """Two renames of the same list in a row give one notification"""
    login(scene.alice)

    edit(client, scene.shopping_list, title="Weekend shop")
    edit(client, scene.shopping_list, title="Weekday shop")

    rows = Notification.query.filter_by(recipient_id=scene.bob.id,
                                        type=T.SHOPPING_LIST_CHANGED).all()
    assert len(rows) == 1
    assert rows[0].count == 2


def test_rename_forbidden(client, login, scene):
    """A refused rename notifies no one"""
    login(scene.bob)

    response = edit(client, scene.shopping_list, title="Mine now")

    assert response.status_code == 403
    assert Notification.query.count() == 0


# ---- SHOPPING_LIST_DELETED ----

def test_delete_by_admin(client, login, scene, admin):
    """An admin deleting a list tells its creator and its members"""
    list_id = scene.shopping_list.id
    login(admin)

    response = delete_list(client, scene.shopping_list)

    assert response.status_code == 200
    assert ShoppingList.query.get(list_id) is None
    assert count(scene.alice, T.SHOPPING_LIST_DELETED) == 1
    assert count(scene.bob, T.SHOPPING_LIST_DELETED) == 1
    assert count(scene.carol, T.SHOPPING_LIST_DELETED) == 0


def test_delete_by_creator(client, login, scene):
    """When the creator deletes, only the members are told"""
    login(scene.alice)

    delete_list(client, scene.shopping_list)

    assert count(scene.bob, T.SHOPPING_LIST_DELETED) == 1
    assert count(scene.alice, T.SHOPPING_LIST_DELETED) == 0


def test_delete_everyone_list(client, login, make_shopping_list, scene):
    """Deleting a list the whole household can see tells everyone but the actor"""
    everyone = make_shopping_list(scene.alice, all_members=True, title="Pantry")
    login(scene.alice)

    delete_list(client, everyone)

    assert count(scene.bob, T.SHOPPING_LIST_DELETED) == 1
    assert count(scene.carol, T.SHOPPING_LIST_DELETED) == 1


def test_delete_stores_fields(client, login, scene):
    """The notification keeps the list's id and title after the list is gone"""
    list_id = scene.shopping_list.id
    title = scene.shopping_list.title
    login(scene.alice)

    delete_list(client, scene.shopping_list)

    row = Notification.query.filter_by(recipient_id=scene.bob.id,
                                       type=T.SHOPPING_LIST_DELETED).one()
    assert row.entity_type == NotificationEntity.SHOPPING_LIST
    assert row.entity_id == list_id
    assert row.entity_label == title


def test_delete_two_lists_folds(client, login, scene, make_shopping_list):
    """Deleting two lists in a row tells the member once"""
    costco = make_shopping_list(scene.alice, all_members=False, title="Costco")
    add_member(costco, scene.bob)
    login(scene.alice)

    delete_list(client, scene.shopping_list)
    delete_list(client, costco)

    rows = Notification.query.filter_by(recipient_id=scene.bob.id,
                                        type=T.SHOPPING_LIST_DELETED).all()
    assert len(rows) == 1
    assert rows[0].count == 2


def test_delete_forbidden(client, login, scene):
    """A refused delete notifies no one"""
    login(scene.bob)

    response = delete_list(client, scene.shopping_list)

    assert response.status_code == 403
    assert Notification.query.count() == 0