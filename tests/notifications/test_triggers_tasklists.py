from types import SimpleNamespace

import pytest

from app.extensions import db
from app.models import Tasklist, TasklistMember, User, FeaturedListSetting
from app.models.notification import Notification, NotificationEntity, NotificationType

T = NotificationType


# ---- HELPERS ----

def feature(user, tasklist):
    """Make this the user's featured list and return the setting row."""
    setting = FeaturedListSetting(user_id=user.id, tasklist_id=tasklist.id)
    db.session.add(setting)
    db.session.commit()
    return setting

def add_member(tasklist, user):
    db.session.add(TasklistMember(tasklist_id=tasklist.id, user_id=user.id))
    db.session.commit()


def count(user, type_):
    return Notification.query.filter_by(recipient_id=user.id, type=type_).count()


def set_members(client, tasklist, user_ids):
    return client.put(f"/api/tasklists/{tasklist.id}/assigned-members",       # MATCH
                      json={"members": list(user_ids)})


def settings(client, tasklist, **payload):
    return client.put(f"/api/tasklists/{tasklist.id}/settings", json=payload)  # MATCH


def rename(client, tasklist, title):
    return client.put(f"/api/tasklists/{tasklist.id}", json={"title": title})  # MATCH


def delete_list(client, tasklist):
    return client.delete(f"/api/tasklists/{tasklist.id}")                      # MATCH


def leave(client, tasklist):
    return client.post(f"/api/tasklists/{tasklist.id}/leave")                  # MATCH


@pytest.fixture
def scene(make_user, make_tasklist):
    """alice made a restricted list, bob is a member, carol has no access."""
    alice = make_user("alice")
    bob = make_user("bob")
    carol = make_user("carol")
    tasklist = make_tasklist(alice, all_members=False)
    add_member(tasklist, bob)
    return SimpleNamespace(alice=alice, bob=bob, carol=carol, tasklist=tasklist)



# ---- TASKLIST_ASSIGNED ----

def test_adding_member_notifies_them(client, login, scene):
    """The person added to a list is told, and the existing members are not"""
    login(scene.alice)

    response = set_members(client, scene.tasklist, [scene.bob.id, scene.carol.id])

    assert response.status_code == 200
    assert count(scene.carol, T.TASKLIST_ASSIGNED) == 1
    assert count(scene.bob, T.TASKLIST_ASSIGNED) == 0


def test_adding_member_through_settings_notifies(client, login, scene):
    """Adding someone through the settings endpoint works the same way"""
    login(scene.alice)

    settings(client, scene.tasklist, memberIds=[scene.bob.id, scene.carol.id])

    assert count(scene.carol, T.TASKLIST_ASSIGNED) == 1


def test_assigned_stores_fields(client, login, scene):
    """The notification points at the list, with its title and who added the person"""
    login(scene.alice)

    set_members(client, scene.tasklist, [scene.bob.id, scene.carol.id])

    row = Notification.query.filter_by(recipient_id=scene.carol.id, type=T.TASKLIST_ASSIGNED).one()
    assert row.entity_type == NotificationEntity.TASKLIST
    assert row.entity_id == scene.tasklist.id
    assert row.entity_label == scene.tasklist.title
    assert row.actor_id == scene.alice.id


def test_adding_yourself_is_silent(client, login, scene, admin):
    """An admin adding themselves to a list notifies no one"""
    login(admin)

    set_members(client, scene.tasklist, [scene.bob.id, admin.id])

    assert Notification.query.count() == 0


def test_switching_to_everyone_notifies_new_people(client, login, household, scene):
    """Opening a list to the whole household tells the people who didn't have it"""
    login(scene.alice)

    set_members(client, scene.tasklist, [u.id for u in household.members])

    assert count(scene.carol, T.TASKLIST_ASSIGNED) == 1
    assert count(scene.bob, T.TASKLIST_ASSIGNED) == 0
    assert count(scene.alice, T.TASKLIST_ASSIGNED) == 0


def test_assigned_folds_across_lists(client, login, scene, make_tasklist):
    """Adding the same person to two lists in a row gives one notification"""
    garden = make_tasklist(scene.alice, all_members=False, title="Garden")
    login(scene.alice)

    set_members(client, scene.tasklist, [scene.bob.id, scene.carol.id])
    set_members(client, garden, [scene.carol.id])

    rows = Notification.query.filter_by(recipient_id=scene.carol.id, type=T.TASKLIST_ASSIGNED).all()
    assert len(rows) == 1
    assert rows[0].count == 2


def test_member_cannot_add_people(client, login, scene):
    """Only the creator or an admin can change who is on a list"""
    login(scene.bob)

    response = set_members(client, scene.tasklist, [scene.bob.id, scene.carol.id])

    assert response.status_code == 403
    assert Notification.query.count() == 0


# ---- TASKLIST_UNASSIGNED ----

def test_removing_member_notifies_them(client, login, scene):
    """The person taken off a list is told"""
    login(scene.alice)

    set_members(client, scene.tasklist, [])

    assert count(scene.bob, T.TASKLIST_UNASSIGNED) == 1
    assert count(scene.alice, T.TASKLIST_UNASSIGNED) == 0


def test_removing_member_through_settings_notifies(client, login, scene):
    """Removing someone through the settings endpoint works the same way"""
    login(scene.alice)

    settings(client, scene.tasklist, memberIds=[])

    assert count(scene.bob, T.TASKLIST_UNASSIGNED) == 1


def test_keeping_member_is_silent(client, login, scene):
    """Saving the same members again notifies no one"""
    login(scene.alice)

    set_members(client, scene.tasklist, [scene.bob.id])

    assert Notification.query.count() == 0


def test_restricting_an_everyone_list_notifies_dropped_people(client, login, make_tasklist, scene):
    """Narrowing an everyone list tells the people who lose it, not the ones who keep it"""
    everyone = make_tasklist(scene.alice, all_members=True, title="Chores")
    login(scene.alice)

    set_members(client, everyone, [scene.bob.id])

    assert count(scene.carol, T.TASKLIST_UNASSIGNED) == 1
    assert count(scene.bob, T.TASKLIST_UNASSIGNED) == 0
    assert count(scene.alice, T.TASKLIST_UNASSIGNED) == 0


def test_unassigned_stores_fields(client, login, scene):
    """The notification points at the list and who removed the person"""
    login(scene.alice)

    set_members(client, scene.tasklist, [])

    row = Notification.query.filter_by(recipient_id=scene.bob.id, type=T.TASKLIST_UNASSIGNED).one()
    assert row.entity_type == NotificationEntity.TASKLIST
    assert row.entity_id == scene.tasklist.id
    assert row.actor_id == scene.alice.id


# ---- TASKLIST_SELF_UNASSIGNED ----

def test_leaving_notifies_creator(client, login, scene):
    """A member leaving a list tells the creator"""
    login(scene.bob)

    response = leave(client, scene.tasklist)

    assert response.status_code == 200
    row = Notification.query.filter_by(recipient_id=scene.alice.id,
                                       type=T.TASKLIST_SELF_UNASSIGNED).one()
    assert row.actor_id == scene.bob.id
    assert row.entity_id == scene.tasklist.id


def test_leaving_removes_membership_and_tells_no_one_else(client, login, scene):
    """Leaving takes the person off the list and sends no 'unassigned' to anyone"""
    login(scene.bob)

    leave(client, scene.tasklist)

    assert TasklistMember.query.filter_by(tasklist_id=scene.tasklist.id,
                                          user_id=scene.bob.id).count() == 0
    assert count(scene.bob, T.TASKLIST_UNASSIGNED) == 0
    assert count(scene.alice, T.TASKLIST_UNASSIGNED) == 0


def test_creator_cannot_leave(client, login, scene):
    """You can't leave a list you created"""
    login(scene.alice)

    response = leave(client, scene.tasklist)

    assert response.status_code == 400
    assert Notification.query.count() == 0


def test_non_member_cannot_leave(client, login, scene):
    """Someone who isn't on the list can't leave it"""
    login(scene.carol)

    response = leave(client, scene.tasklist)

    assert response.status_code == 404
    assert Notification.query.count() == 0


def test_cannot_leave_everyone_list(client, login, make_tasklist, scene):
    """A list everybody has can't be left"""
    everyone = make_tasklist(scene.alice, all_members=True, title="Chores")
    login(scene.bob)

    response = leave(client, everyone)

    assert response.status_code == 400
    assert Notification.query.count() == 0


def test_admin_removing_themselves_notifies_creator(client, login, scene, admin):
    """An admin who takes themselves off a list is a self-unassign too"""
    add_member(scene.tasklist, admin)
    login(admin)

    set_members(client, scene.tasklist, [scene.bob.id])

    assert count(scene.alice, T.TASKLIST_SELF_UNASSIGNED) == 1
    assert count(scene.alice, T.TASKLIST_UNASSIGNED) == 0
    assert count(admin, T.TASKLIST_UNASSIGNED) == 0


# ---- TASKLIST_CHANGED ----

def test_rename_by_admin_notifies_creator_and_members(client, login, scene, admin):
    """An admin renaming a list tells its creator and its members, not outsiders"""
    login(admin)

    response = rename(client, scene.tasklist, "Weekend chores")

    assert response.status_code == 200
    assert count(scene.alice, T.TASKLIST_CHANGED) == 1
    assert count(scene.bob, T.TASKLIST_CHANGED) == 1
    assert count(scene.carol, T.TASKLIST_CHANGED) == 0


def test_rename_by_creator_notifies_members_only(client, login, scene):
    """When the creator renames, only the members are told"""
    login(scene.alice)

    rename(client, scene.tasklist, "Weekend chores")

    assert count(scene.bob, T.TASKLIST_CHANGED) == 1
    assert count(scene.alice, T.TASKLIST_CHANGED) == 0


def test_rename_through_settings_notifies(client, login, scene):
    """Renaming through the settings endpoint works the same way"""
    login(scene.alice)

    settings(client, scene.tasklist, title="Weekend chores")

    assert count(scene.bob, T.TASKLIST_CHANGED) == 1


def test_rename_stores_new_title(client, login, scene):
    """The notification carries the new title"""
    login(scene.alice)

    rename(client, scene.tasklist, "Weekend chores")

    row = Notification.query.filter_by(recipient_id=scene.bob.id, type=T.TASKLIST_CHANGED).one()
    assert row.entity_type == NotificationEntity.TASKLIST
    assert row.entity_id == scene.tasklist.id
    assert row.entity_label == "Weekend chores"


def test_rename_everyone_list_notifies_household(client, login, make_tasklist, scene):
    """Renaming a list the whole household can see tells everyone but the actor"""
    everyone = make_tasklist(scene.alice, all_members=True, title="Chores")
    login(scene.alice)

    rename(client, everyone, "Weekend chores")

    assert count(scene.bob, T.TASKLIST_CHANGED) == 1
    assert count(scene.carol, T.TASKLIST_CHANGED) == 1


def test_same_title_is_silent(client, login, scene):
    """Saving the title it already has notifies no one"""
    login(scene.alice)

    rename(client, scene.tasklist, scene.tasklist.title)
    settings(client, scene.tasklist, title=scene.tasklist.title)

    assert Notification.query.count() == 0


def test_other_settings_are_silent(client, login, scene):
    """Changing the color or view mode is not a change worth a notification"""
    login(scene.alice)

    settings(client, scene.tasklist, color="red", viewMode="grid")

    assert Notification.query.count() == 0


def test_rename_and_add_member_tells_new_member_assigned_only(client, login, scene):
    """Renaming and adding someone in one save: the new person hears 'assigned', not 'changed'"""
    login(scene.alice)

    settings(client, scene.tasklist, title="Weekend chores",
             memberIds=[scene.bob.id, scene.carol.id])

    assert count(scene.carol, T.TASKLIST_ASSIGNED) == 1
    assert count(scene.carol, T.TASKLIST_CHANGED) == 0
    assert count(scene.bob, T.TASKLIST_CHANGED) == 1


def test_rename_and_remove_member_tells_removed_member_unassigned_only(client, login, scene):
    """Renaming and removing someone in one save: they hear 'unassigned', not 'changed'"""
    login(scene.alice)

    settings(client, scene.tasklist, title="Weekend chores", memberIds=[])

    assert count(scene.bob, T.TASKLIST_UNASSIGNED) == 1
    assert count(scene.bob, T.TASKLIST_CHANGED) == 0


def test_repeated_renames_fold(client, login, scene):
    """Two renames of the same list in a row give one notification"""
    login(scene.alice)

    rename(client, scene.tasklist, "Weekend chores")
    rename(client, scene.tasklist, "Weekday chores")

    rows = Notification.query.filter_by(recipient_id=scene.bob.id, type=T.TASKLIST_CHANGED).all()
    assert len(rows) == 1
    assert rows[0].count == 2


def test_rename_forbidden_leaves_nothing(client, login, scene):
    """A refused rename notifies no one"""
    login(scene.bob)

    response = rename(client, scene.tasklist, "Mine now")

    assert response.status_code == 403
    assert Notification.query.count() == 0


# ---- TASKLIST_DELETED ----

def test_delete_by_admin_notifies_creator_and_members(client, login, scene, admin):
    """An admin deleting a list tells its creator and its members"""
    list_id = scene.tasklist.id
    login(admin)

    response = delete_list(client, scene.tasklist)

    assert response.status_code == 200
    assert Tasklist.query.get(list_id) is None
    assert count(scene.alice, T.TASKLIST_DELETED) == 1
    assert count(scene.bob, T.TASKLIST_DELETED) == 1
    assert count(scene.carol, T.TASKLIST_DELETED) == 0


def test_delete_by_creator_notifies_members_only(client, login, scene):
    """When the creator deletes, only the members are told"""
    login(scene.alice)

    delete_list(client, scene.tasklist)

    assert count(scene.bob, T.TASKLIST_DELETED) == 1
    assert count(scene.alice, T.TASKLIST_DELETED) == 0


def test_delete_everyone_list_notifies_household(client, login, make_tasklist, scene):
    """Deleting a list the whole household can see tells everyone but the actor"""
    everyone = make_tasklist(scene.alice, all_members=True, title="Chores")
    login(scene.alice)

    delete_list(client, everyone)

    assert count(scene.bob, T.TASKLIST_DELETED) == 1
    assert count(scene.carol, T.TASKLIST_DELETED) == 1


def test_delete_stores_fields(client, login, scene):
    """The notification keeps the list's id and title after the list is gone"""
    list_id = scene.tasklist.id
    title = scene.tasklist.title
    login(scene.alice)

    delete_list(client, scene.tasklist)

    row = Notification.query.filter_by(recipient_id=scene.bob.id, type=T.TASKLIST_DELETED).one()
    assert row.entity_type == NotificationEntity.TASKLIST
    assert row.entity_id == list_id
    assert row.entity_label == title


def test_delete_two_lists_folds(client, login, scene, make_tasklist):
    """Deleting two lists in a row tells the member once"""
    garden = make_tasklist(scene.alice, all_members=False, title="Garden")
    add_member(garden, scene.bob)
    login(scene.alice)

    delete_list(client, scene.tasklist)
    delete_list(client, garden)

    rows = Notification.query.filter_by(recipient_id=scene.bob.id, type=T.TASKLIST_DELETED).all()
    assert len(rows) == 1
    assert rows[0].count == 2


def test_delete_does_not_send_task_notifications(client, login, scene, make_task):
    """Deleting a list sends one list notification, not one per task"""
    make_task(scene.tasklist, scene.alice, title="Dishes", assigned_to_id=scene.bob.id)
    login(scene.alice)

    delete_list(client, scene.tasklist)

    assert count(scene.bob, T.TASK_DELETED) == 0
    assert count(scene.bob, T.TASKLIST_DELETED) == 1


def test_delete_forbidden_leaves_nothing(client, login, scene):
    """A refused delete notifies no one"""
    login(scene.bob)

    response = delete_list(client, scene.tasklist)

    assert response.status_code == 403
    assert Notification.query.count() == 0


def test_household_owned_list_has_no_creator_to_notify(client, login, make_tasklist, scene, admin):
    """A list with no creator can still be renamed; only its members are told"""
    owned = make_tasklist(scene.alice, creator_id=None, all_members=False, title="House")
    add_member(owned, scene.bob)
    login(admin)

    response = rename(client, owned, "Household")

    assert response.status_code == 200
    assert count(scene.bob, T.TASKLIST_CHANGED) == 1


def test_leaving_clears_featured_list(client, login, scene):
    """Leaving a list unfeatures it for the person who left"""
    setting = feature(scene.bob, scene.tasklist)
    login(scene.bob)

    leave(client, scene.tasklist)

    db.session.refresh(setting)
    assert setting.tasklist_id is None


def test_removing_member_clears_their_featured_list(client, login, scene):
    """Taking someone off a list unfeatures it for them"""
    setting = feature(scene.bob, scene.tasklist)
    login(scene.alice)

    set_members(client, scene.tasklist, [])

    db.session.refresh(setting)
    assert setting.tasklist_id is None


def test_removing_member_keeps_other_featured_lists(client, login, scene, make_tasklist):
    """Other people's featured lists, and the same person's other lists, are untouched"""
    garden = make_tasklist(scene.alice, all_members=False, title="Garden")
    add_member(garden, scene.bob)
    creator_setting = feature(scene.alice, scene.tasklist)
    login(scene.alice)

    set_members(client, scene.tasklist, [])
    bobs_setting = feature(scene.bob, garden)
    set_members(client, scene.tasklist, [])

    db.session.refresh(creator_setting)
    db.session.refresh(bobs_setting)
    assert creator_setting.tasklist_id == scene.tasklist.id
    assert bobs_setting.tasklist_id == garden.id



def test_household_owned_list_has_no_creator_to_notify(client, login, make_tasklist, scene, admin):
    """A list with no creator can still be renamed; only its members are told"""
    owned = make_tasklist(scene.alice, creator_id=None, all_members=False, title="House")
    add_member(owned, scene.bob)
    login(admin)

    response = rename(client, owned, "Household")

    assert response.status_code == 200
    assert count(scene.bob, T.TASKLIST_CHANGED) == 1


def create_household_list(client, household, **payload):
    body = {"title": "Garden", "color": "#15aabf"}
    body.update(payload)
    return client.post(f"/api/households/{household.id}/tasklists", json=body)     # MATCH


def duplicate(client, tasklist):
    return client.post(f"/api/tasklists/{tasklist.id}/duplicate")                  # MATCH


def test_creating_subset_list_notifies_members(client, login, household, scene):
    """A new list for chosen people tells those people, not the creator or anyone else"""
    login(scene.alice)

    response = create_household_list(client, household, allMembers=False,
                                     memberIds=[scene.alice.id, scene.bob.id])

    assert response.status_code == 201
    assert count(scene.bob, T.TASKLIST_ASSIGNED) == 1
    assert count(scene.alice, T.TASKLIST_ASSIGNED) == 0
    assert count(scene.carol, T.TASKLIST_ASSIGNED) == 0


def test_creating_subset_list_stores_fields(client, login, household, scene):
    """The notification points at the new list"""
    login(scene.alice)

    response = create_household_list(client, household, title="Garden",
                                     allMembers=False, memberIds=[scene.bob.id])

    row = Notification.query.filter_by(recipient_id=scene.bob.id, type=T.TASKLIST_ASSIGNED).one()
    assert row.entity_type == NotificationEntity.TASKLIST
    assert row.entity_id == response.get_json()["id"]
    assert row.entity_label == "Garden"
    assert row.actor_id == scene.alice.id


def test_creating_everyone_list_is_silent(client, login, household, scene):
    """A list for the whole household notifies no one"""
    login(scene.alice)

    create_household_list(client, household, allMembers=True)

    assert Notification.query.count() == 0


def test_creating_invalid_list_is_silent(client, login, household, scene):
    """A refused creation notifies no one"""
    login(scene.alice)

    response = create_household_list(client, household, allMembers=False, memberIds=[])

    assert response.status_code == 400
    assert Notification.query.count() == 0


def test_duplicating_subset_list_notifies_members(client, login, scene, admin):
    """Duplicating a restricted list tells the people copied onto it"""
    login(admin)

    response = duplicate(client, scene.tasklist)

    assert response.status_code == 201
    row = Notification.query.filter_by(recipient_id=scene.bob.id, type=T.TASKLIST_ASSIGNED).one()
    assert row.entity_id == response.get_json()["id"]


def test_duplicating_everyone_list_is_silent(client, login, make_tasklist, scene, admin):
    """Duplicating a household-wide list notifies no one"""
    everyone = make_tasklist(scene.alice, all_members=True, title="Chores")
    login(admin)

    duplicate(client, everyone)

    assert Notification.query.count() == 0