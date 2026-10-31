import pytest

from app import create_app
from app.config import Config
from app.extensions import db as _db
from app.models import Household, User 

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
        yield app # The test runs here
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
    colors = iter(MEMBER_COLORS) # next(colors) gives a new color each call

    def _make(name, **overrides):
        fields = {"household_id": household.id, "color": next(colors)}
        fields.update(overrides)
        return _create_user(db, name, **fields)
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
            session["_user_id"] = str(user.id) # Flask-Login's session key
            session["_fresh"] = True
    return _login