import pytest

from app import create_app
from app.config import Config
from app.extensions import db as _db
from app.models import Household, User, Notification, NotificationType, NotificationEntity, Task, Tasklist, ShoppingList, Event, EventAttendee, Announcement
from datetime import datetime, timezone

# Each user needs a different color
# Admin gets "black", and make_user hands out these in order
MEMBER_COLORS = ["blue", "red", "green", "purple", "pink", "orange", "yellow", "cyan", "lime", "navy"]


class ConfigForTests(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_ENGINE_OPTIONS = {}
    SQLALCHEMY_ECHO = False
    RUN_SCHEDULER = False


@pytest.fixture
def app():
    """A fresh app with an empty in-memory database for every test."""
    app = create_app(ConfigForTests)
    with app.app_context():
        assert _db.engine.url.database == ":memory:", (
            f"Refusing to run tests against {_db.engine.url}"
        )
        _db.create_all()
        yield app
        _db.session.remove()
        _db.drop_all()


@pytest.fixture
def db(app):
    """The database handle"""
    return _db


def _create_user(db, name, **overrides):
    """Create and commit one user"""
    fields = {
        "first_name": name.capitalize(),
        "last_name": "Test",
        "email": f"{name}@example.com",
        "timezone": "UTC",
        "daily_checkin": False,
        "color": "blue"
    }
    fields.update(overrides) 
    user = User(**fields)
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def household(db):
    """Household, with its admin"""
    admin = _create_user(db, "admin", color="black")
    household = Household(
        name="Test house", 
        admin_id=admin.id, 
        tzid="America/Los_Angeles", 
        accent_color="gray"
    )
    db.session.add(household)
    db.session.commit()

    admin.household_id = household.id
    db.session.commit()
    return household


@pytest.fixture
def make_user(db, household):
    """Factory: make_user("alice") creates a user in the test household."""
    colors = iter(MEMBER_COLORS)

    def _make(name, **overrides):
        fields = {"household_id": household.id, "color": next(colors)}
        fields.update(overrides)
        return _create_user(db, name, **fields)
    return _make


@pytest.fixture
def make_notification(db, household):
    """Insert one notification row and return it."""
    def _make(recipient, **overrides):
        fields = dict(
            household_id=household.id,
            recipient_id=recipient.id,
            actor_id=None,
            type=NotificationType.TASK_ASSIGNED,
            entity_type=NotificationEntity.TASK,
            entity_id=1,
            entity_label="Dishes",
            entity_labels=["Dishes"],
        )
        fields.update(overrides)
        notification = Notification(**fields)
        db.session.add(notification)
        db.session.commit()
        return notification
    return _make


@pytest.fixture
def client(app):
    """Fake HTTP client for route tests"""
    return app.test_client()
    

@pytest.fixture
def login(client):
    """login(user) makes later requests from `client` look signed in as that user"""
    def _login(user):
        with client.session_transaction() as session:
            session["_user_id"] = str(user.id)
            session["_fresh"] = True
    return _login


@pytest.fixture
def make_tasklist(db, household):
    def _make(creator, **overrides):
        fields = dict(title="Chores", color="blue", household_id=household.id, all_members=True, creator_id=creator.id)
        fields.update(overrides)
        tasklist = Tasklist(**fields)
        db.session.add(tasklist)
        db.session.commit()
        return tasklist
    return _make


@pytest.fixture
def make_task(db):
    def _make(tasklist, creator, **overrides):
        fields = dict(title="Dishes", list_id=tasklist.id, creator_id=creator.id, assigned_to_id=None)
        fields.update(overrides)
        task = Task(**fields)
        db.session.add(task)
        db.session.commit()
        return task
    return _make


@pytest.fixture
def make_event(db, household):
    def _make(creator, attendees=(), **overrides):
        args = dict(
            household_id=household.id,
            creator_id=creator.id,
            title="Dinner",
            tzid="UTC",
            start_utc=datetime(2026, 12, 1, 18, 0, tzinfo=timezone.utc),
            end_utc=datetime(2026, 12, 1, 19, 0, tzinfo=timezone.utc),
            has_time=True,
        )
        args.update(overrides)
        event = Event(**args)
        db.session.add(event)
        db.session.flush()
        for user in attendees:
            db.session.add(EventAttendee(event_id=event.id, user_id=user.id))
        db.session.commit()
        return event
    return _make


@pytest.fixture
def make_shopping_list(db, household):
    def _make(creator, **overrides):
        args = dict(
            title="Groceries",
            household_id=household.id,
            creator_id=creator.id,
            all_members=True,
        )
        args.update(overrides)
        shopping_list = ShoppingList(**args)
        db.session.add(shopping_list)
        db.session.commit()
        return shopping_list
    return _make

@pytest.fixture
def make_announcement(db, household):
    def _make(author, **overrides):
        args = dict(
            household_id=household.id,
            user_id=author.id,
            message="Trash day moved to Friday",
        )
        args.update(overrides)
        announcement = Announcement(**args)
        db.session.add(announcement)
        db.session.commit()
        return announcement
    return _make


@pytest.fixture
def admin(household):
    return User.query.get(household.admin_id)


