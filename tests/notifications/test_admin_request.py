from app.api.household_routes import detach_from_household
from app.models import Notification, NotificationType


def url(household, suffix=""):
    return f"/api/households/{household.id}/admin-request{suffix}"  # MATCH


def leave_url(household):
    return f"/api/households/{household.id}/leave"  # MATCH


def set_pending(db, household, candidate):
    """Put an offer in place directly, so a test can act as the candidate."""
    household.pending_admin_id = candidate.id
    db.session.commit()


def notes(user, type_):
    return Notification.query.filter_by(recipient_id=user.id, type=type_).all()


# ---- CREATE ----

def test_admin_can_create(client, login, db, household, admin, make_user):
    """Admin offers the role: 201, the column is set, the candidate is notified."""
    bob = make_user("bob")
    login(admin)

    res = client.post(url(household), json={"newAdminId": bob.id})

    assert res.status_code == 201
    assert res.get_json()["request"]["toUserId"] == bob.id
    db.session.refresh(household)
    assert household.pending_admin_id == bob.id
    assert household.admin_id == admin.id
    assert len(notes(bob, NotificationType.ADMIN_REQUEST)) == 1


def test_non_admin_forbidden(client, login, db, household, make_user):
    """A regular member can't offer the role: 403, nothing set, nobody notified."""
    bob = make_user("bob")
    carol = make_user("carol")
    login(bob)

    res = client.post(url(household), json={"newAdminId": carol.id})

    assert res.status_code == 403
    db.session.refresh(household)
    assert household.pending_admin_id is None
    assert notes(carol, NotificationType.ADMIN_REQUEST) == []


def test_cannot_ask_self(client, login, db, household, admin):
    """The admin offering the role to themselves is a 400."""
    login(admin)

    res = client.post(url(household), json={"newAdminId": admin.id})

    assert res.status_code == 400
    db.session.refresh(household)
    assert household.pending_admin_id is None


def test_candidate_must_be_member(client, login, db, household, admin, make_user):
    """Someone outside the household can't be offered the role: 400."""
    outsider = make_user("outsider", household_id=None)
    login(admin)

    res = client.post(url(household), json={"newAdminId": outsider.id})

    assert res.status_code == 400
    db.session.refresh(household)
    assert household.pending_admin_id is None


def test_second_request_conflicts(client, login, db, household, admin, make_user):
    """With an offer pending, a second one is a 409 and the first stays intact."""
    bob = make_user("bob")
    carol = make_user("carol")
    set_pending(db, household, bob)
    login(admin)

    res = client.post(url(household), json={"newAdminId": carol.id})

    assert res.status_code == 409
    db.session.refresh(household)
    assert household.pending_admin_id == bob.id
    assert notes(carol, NotificationType.ADMIN_REQUEST) == []


# ---- GET ----

def test_get_returns_pending(client, login, db, household, admin, make_user):
    """Any member sees who the offer is from and to."""
    bob = make_user("bob")
    set_pending(db, household, bob)
    login(bob)

    res = client.get(url(household))

    assert res.status_code == 200
    body = res.get_json()["request"]
    assert body["fromUserId"] == admin.id
    assert body["toUserId"] == bob.id


def test_get_none_when_empty(client, login, household, admin):
    """With nothing pending, the request comes back as null."""
    login(admin)

    res = client.get(url(household))

    assert res.status_code == 200
    assert res.get_json() == {"request": None}


def test_get_outsider_forbidden(client, login, household, make_user):
    """Someone who isn't in the household can't read its pending request."""
    outsider = make_user("outsider", household_id=None)
    login(outsider)

    res = client.get(url(household))

    assert res.status_code == 403


# ---- ACCEPT ----

def test_accept_moves_admin(client, login, db, household, admin, make_user):
    """Accepting hands over the role, clears the offer, and tells the old admin."""
    bob = make_user("bob")
    set_pending(db, household, bob)
    login(bob)

    res = client.post(url(household, "/accept"))

    assert res.status_code == 200
    db.session.refresh(household)
    assert household.admin_id == bob.id
    assert household.pending_admin_id is None
    assert len(notes(admin, NotificationType.ADMIN_CHANGED)) == 1


def test_accept_wrong_user_forbidden(client, login, db, household, admin, make_user):
    """Only the named candidate can accept: 403, offer and admin unchanged."""
    bob = make_user("bob")
    carol = make_user("carol")
    set_pending(db, household, bob)
    login(carol)

    res = client.post(url(household, "/accept"))

    assert res.status_code == 403
    db.session.refresh(household)
    assert household.admin_id == admin.id
    assert household.pending_admin_id == bob.id


def test_accept_without_request_404(client, login, household, make_user):
    """Accepting when nothing is pending is a 404."""
    bob = make_user("bob")
    login(bob)

    res = client.post(url(household, "/accept"))

    assert res.status_code == 404


# ---- DECLINE ----

def test_decline_clears_and_notifies(client, login, db, household, admin, make_user):
    """Declining clears the offer, keeps the admin, and tells the admin."""
    bob = make_user("bob")
    set_pending(db, household, bob)
    login(bob)

    res = client.post(url(household, "/decline"))

    assert res.status_code == 200
    db.session.refresh(household)
    assert household.pending_admin_id is None
    assert household.admin_id == admin.id
    assert len(notes(admin, NotificationType.ADMIN_REQUEST_DECLINED)) == 1


def test_decline_wrong_user_forbidden(client, login, db, household, make_user):
    """Only the named candidate can decline: 403, offer stays pending."""
    bob = make_user("bob")
    carol = make_user("carol")
    set_pending(db, household, bob)
    login(carol)

    res = client.post(url(household, "/decline"))

    assert res.status_code == 403
    db.session.refresh(household)
    assert household.pending_admin_id == bob.id


# ---- CANCEL ----

def test_cancel_clears_pending(client, login, db, household, admin, make_user):
    """The admin can withdraw their own offer."""
    bob = make_user("bob")
    set_pending(db, household, bob)
    login(admin)

    res = client.delete(url(household))

    assert res.status_code == 200
    db.session.refresh(household)
    assert household.pending_admin_id is None
    assert household.admin_id == admin.id


def test_cancel_retracts_unread(client, login, db, household, admin, make_user):
    """Cancelling removes the candidate's unread ADMIN_REQUEST notification."""
    bob = make_user("bob")
    login(admin)
    client.post(url(household), json={"newAdminId": bob.id})
    assert len(notes(bob, NotificationType.ADMIN_REQUEST)) == 1

    res = client.delete(url(household))

    assert res.status_code == 200
    assert notes(bob, NotificationType.ADMIN_REQUEST) == []


def test_cancel_non_admin_forbidden(client, login, db, household, make_user):
    """A regular member can't cancel the admin's offer: 403, still pending."""
    bob = make_user("bob")
    carol = make_user("carol")
    set_pending(db, household, bob)
    login(carol)

    res = client.delete(url(household))

    assert res.status_code == 403
    db.session.refresh(household)
    assert household.pending_admin_id == bob.id


# ---- DETACH ----

def test_removed_candidate_clears(db, household, make_user):
    """Removing the candidate from the household drops the offer."""
    bob = make_user("bob")
    set_pending(db, household, bob)

    detach_from_household(bob)
    db.session.commit()

    db.session.refresh(household)
    assert household.pending_admin_id is None
    assert bob.household_id is None


def test_leaving_candidate_clears(client, login, db, household, make_user):
    """If the candidate leaves the household, the offer is dropped."""
    bob = make_user("bob")
    set_pending(db, household, bob)
    login(bob)

    res = client.post(leave_url(household))

    assert res.status_code == 200
    db.session.refresh(household)
    assert household.pending_admin_id is None