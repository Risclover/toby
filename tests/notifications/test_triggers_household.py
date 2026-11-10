from types import SimpleNamespace

import pytest

from app.extensions import db
from app.models import FeaturedListSetting, Household, User
from app.models.notification import Notification, NotificationEntity, NotificationType

T = NotificationType


# ---- HELPERS ----

def count(user, type_):
    return Notification.query.filter_by(recipient_id=user.id, type=type_).count()


def join(client, household, email="dave@example.com", first="Dave"):
    return client.post(f"/api/auth/join/{household.invite_code}",                     # MATCH
                       json={"firstName": first, "lastName": "New", "email": email,
                             "password": "password123"})


def sign_up(client, email="erin@example.com", first="Erin"):
    return client.post("/api/auth/signup",                                            # MATCH
                       json={"firstName": first, "lastName": "New", "email": email,
                             "password": "password123"})


def join_existing(client, household):
    return client.post(f"/api/auth/household/join/{household.invite_code}")           # MATCH


def remove(client, household, user):
    return client.delete(f"/api/households/{household.id}/members/{user.id}")         # MATCH


def transfer(client, household, new_admin_id):
    return client.patch(f"/api/households/{household.id}/admin",                      # MATCH
                        json={"newAdminId": new_admin_id})


@pytest.fixture
def scene(make_user, household):
    household.invite_code = "invite-123"
    db.session.commit()
    return SimpleNamespace(alice=make_user("alice"), bob=make_user("bob"))


# ---- MEMBER_JOINED ----

def test_join_notifies_members(client, household, scene, admin):
    """Everyone already in the household is told, and the newcomer is not"""
    response = join(client, household)

    new_id = response.get_json()["user"]["id"]
    assert response.status_code == 201
    assert count(scene.alice, T.MEMBER_JOINED) == 1
    assert count(scene.bob, T.MEMBER_JOINED) == 1
    assert count(admin, T.MEMBER_JOINED) == 1
    assert Notification.query.filter_by(recipient_id=new_id).count() == 0


def test_join_stores_fields(client, household, scene):
    """The notification points at the new member, who is also its actor"""
    new_id = join(client, household).get_json()["user"]["id"]

    row = Notification.query.filter_by(recipient_id=scene.alice.id).one()
    assert row.entity_type == NotificationEntity.USER
    assert row.entity_id == new_id
    assert row.entity_label == User.query.get(new_id).display_name
    assert row.actor_id == new_id
    assert row.household_id == household.id


def test_join_existing_notifies(client, household, scene):
    """A signed-up user joining with a code tells the members"""
    sign_up(client)

    response = join_existing(client, household)

    assert response.status_code == 200
    assert count(scene.alice, T.MEMBER_JOINED) == 1
    assert count(scene.bob, T.MEMBER_JOINED) == 1


def test_two_joins_stay_separate(client, household, scene):
    """Different people joining give separate notifications, since folding is per actor"""
    join(client, household, email="dave@example.com", first="Dave")
    client.get("/api/auth/logout")                                                    # MATCH
    join(client, household, email="frank@example.com", first="Frank")

    rows = Notification.query.filter_by(recipient_id=scene.alice.id,
                                        type=T.MEMBER_JOINED).all()
    assert len(rows) == 2


def test_rejoin_own_household_silent(client, login, household, scene):
    """Using your own household's code again notifies no one"""
    login(scene.alice)

    response = join_existing(client, household)

    assert response.status_code == 200
    assert Notification.query.count() == 0


def test_bad_invite_code_silent(client, household, scene):
    """A wrong code creates no user and notifies no one"""
    household.invite_code = "something-else"
    db.session.commit()

    response = client.post("/api/auth/join/nope",                                     # MATCH
                           json={"firstName": "X", "lastName": "Y",
                                 "email": "x@example.com", "password": "password123"})

    assert response.status_code == 400
    assert Notification.query.count() == 0


# ---- MEMBER_REMOVED AND USER_REMOVED ----

def test_removal_tells_rest_and_removed(client, login, household, scene, admin):
    """The remaining members hear 'removed', the removed person hears 'you were removed'"""
    login(admin)

    response = remove(client, household, scene.bob)

    assert response.status_code == 200
    assert count(scene.alice, T.MEMBER_REMOVED) == 1
    assert count(scene.bob, T.USER_REMOVED) == 1
    assert count(scene.bob, T.MEMBER_REMOVED) == 0
    assert count(scene.alice, T.USER_REMOVED) == 0
    assert count(admin, T.MEMBER_REMOVED) == 0
    assert count(admin, T.USER_REMOVED) == 0


def test_removal_fields(client, login, household, scene, admin):
    """Both notifications keep the old household, the removed user and the admin"""
    login(admin)

    remove(client, household, scene.bob)

    gone = Notification.query.filter_by(recipient_id=scene.bob.id, type=T.USER_REMOVED).one()
    assert gone.household_id == household.id
    assert gone.entity_type == NotificationEntity.USER
    assert gone.entity_id == scene.bob.id
    assert gone.entity_label == household.name
    assert gone.actor_id == admin.id

    rest = Notification.query.filter_by(recipient_id=scene.alice.id,
                                        type=T.MEMBER_REMOVED).one()
    assert rest.entity_id == scene.bob.id
    assert rest.entity_label == scene.bob.display_name


def test_removal_clears_featured_list(client, login, household, scene, admin, make_tasklist):
    """The removed person's featured list is cleared"""
    tasklist = make_tasklist(scene.alice, all_members=True)
    db.session.add(FeaturedListSetting(user_id=scene.bob.id, tasklist_id=tasklist.id))
    db.session.commit()
    login(admin)

    remove(client, household, scene.bob)

    assert FeaturedListSetting.query.filter_by(user_id=scene.bob.id).one().tasklist_id is None


def test_removal_forbidden_silent(client, login, household, scene):
    """Only the admin can remove people, and a refused removal notifies no one"""
    login(scene.alice)

    response = remove(client, household, scene.bob)

    assert response.status_code == 403
    assert Notification.query.count() == 0


def test_removing_admin_silent(client, login, household, scene, admin):
    """The admin can't remove themselves, and nobody is told"""
    login(admin)

    response = remove(client, household, admin)

    assert response.status_code == 403
    assert Notification.query.count() == 0


# ---- ADMIN_CHANGED ----

def test_transfer_tells_everyone(client, login, household, scene, admin):
    """Everyone but the old admin hears about it, the new admin included"""
    login(admin)

    response = transfer(client, household, scene.bob.id)

    assert response.status_code == 200
    assert count(scene.alice, T.ADMIN_CHANGED) == 1
    assert count(scene.bob, T.ADMIN_CHANGED) == 1
    assert count(admin, T.ADMIN_CHANGED) == 0


def test_transfer_fields(client, login, household, scene, admin):
    """The notification points at the new admin and names the old one as actor"""
    login(admin)

    transfer(client, household, scene.bob.id)

    row = Notification.query.filter_by(recipient_id=scene.alice.id).one()
    assert row.entity_type == NotificationEntity.USER
    assert row.entity_id == scene.bob.id
    assert row.entity_label == scene.bob.display_name
    assert row.actor_id == admin.id
    assert Household.query.get(household.id).admin_id == scene.bob.id


def test_transfer_forbidden_silent(client, login, household, scene):
    """Only the admin can transfer the role"""
    login(scene.alice)

    response = transfer(client, household, scene.bob.id)

    assert response.status_code == 403
    assert Notification.query.count() == 0


def test_transfer_to_self_rejected(client, login, household, scene, admin):
    """Handing the role to yourself is a 400 and tells no one"""
    login(admin)

    response = transfer(client, household, admin.id)

    assert response.status_code == 400
    assert Notification.query.count() == 0


def test_transfer_to_outsider_silent(client, login, household, scene, admin):
    """A user who isn't in the household can't be made admin"""
    login(admin)

    response = transfer(client, household, 999999)

    assert response.status_code == 404
    assert Notification.query.count() == 0


# ---- MEMBER_LEFT ----

def leave(client, household):
    return client.post(f"/api/households/{household.id}/leave")                       # MATCH


def test_leave_tells_the_rest(client, login, household, scene, admin):
    """Everyone who stays is told, and the person leaving is not"""
    login(scene.bob)

    response = leave(client, household)

    assert response.status_code == 200
    assert User.query.get(scene.bob.id).household_id is None
    assert count(scene.alice, T.MEMBER_LEFT) == 1
    assert count(admin, T.MEMBER_LEFT) == 1
    assert count(scene.bob, T.MEMBER_LEFT) == 0


def test_leave_fields(client, login, household, scene):
    """The notification points at the person who left, and names them as actor"""
    login(scene.bob)

    leave(client, household)

    row = Notification.query.filter_by(recipient_id=scene.alice.id).one()
    assert row.entity_type == NotificationEntity.USER
    assert row.entity_id == scene.bob.id
    assert row.entity_label == scene.bob.display_name
    assert row.actor_id == scene.bob.id
    assert row.household_id == household.id


def test_leave_is_not_a_removal(client, login, household, scene):
    """Leaving sends no removal notifications and doesn't mark the user as removed"""
    login(scene.bob)

    leave(client, household)

    assert User.query.get(scene.bob.id).removed_from_household_id is None
    assert count(scene.alice, T.MEMBER_REMOVED) == 0
    assert count(scene.bob, T.USER_REMOVED) == 0


def test_leave_clears_featured_list(client, login, household, scene, make_tasklist):
    """The leaving person's featured list is cleared"""
    tasklist = make_tasklist(scene.alice, all_members=True)
    db.session.add(FeaturedListSetting(user_id=scene.bob.id, tasklist_id=tasklist.id))
    db.session.commit()
    login(scene.bob)

    leave(client, household)

    assert FeaturedListSetting.query.filter_by(user_id=scene.bob.id).one().tasklist_id is None


def test_admin_cannot_leave(client, login, household, scene, admin):
    """The admin has to transfer the role first, and nobody is told"""
    login(admin)

    response = leave(client, household)

    assert response.status_code == 400
    assert User.query.get(admin.id).household_id == household.id
    assert Notification.query.count() == 0


def test_admin_can_leave_after_transfer(client, login, household, scene, admin):
    """Once the role is handed over, the old admin can leave"""
    login(admin)
    transfer(client, household, scene.bob.id)

    response = leave(client, household)

    assert response.status_code == 200
    assert count(scene.alice, T.ADMIN_CHANGED) == 1
    assert count(scene.alice, T.MEMBER_LEFT) == 1


def test_outsider_cannot_leave(client, household, scene):
    """Someone who isn't in the household can't leave it"""
    sign_up(client)

    response = leave(client, household)

    assert response.status_code == 403
    assert Notification.query.count() == 0