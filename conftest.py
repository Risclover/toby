import pytest
from app import create_app
from app.extensions import db as _db
from app.models import User, Household, Announcement, AnnouncementSeen
from datetime import datetime, timezone
from flask_login import login_user

class TestConfig:
    TESTING = True
    SECRET_KEY = "test-secret-key"
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False
    WTF_CSRF_ENABLED = False


# Fixtures

@pytest.fixture(scope="session")
def app():
    """Create app once for the entire test session."""
    app = create_app(TestConfig)
    with app.app_context():
        _db.create_all()
        yield app
        _db.drop_all()


@pytest.fixture(scope="function", autouse=True)
def clean_db(app):
    """Wipe all tables between tests so they don't bleed into each other."""
    yield
    with app.app_context():
        for table in reversed(_db.metadata.sorted_tables):
            _db.session.execute(table.delete())
        _db.session.commit()


@pytest.fixture()
def client(app):
    """Plain test client — not logged in."""
    return app.test_client()



# Auth helper 

@pytest.fixture()
def auth_client(app):
    """
    Returns a helper that logs in as a given user and returns a test client.
    Usage:
        client = auth_client(sara)
    """
    def _make_client(user):
        client = app.test_client()
        with client.session_transaction() as sess:
            sess["_user_id"] = str(user.id)
            sess["_fresh"] = True
        return client

    return _make_client



# Model factories

@pytest.fixture()
def make_user(app):
    """Factory for creating users."""
    def _make(first_name="Test", email=None, password="password", household_id=None):
        with app.app_context():
            user = User(
                first_name=first_name,
                email=email or f"{first_name.lower()}@test.com",
                household_id=household_id,
            )
            user.set_password(password)
            _db.session.add(user)
            _db.session.commit()
            return user
    return _make


@pytest.fixture()
def make_household(app):
    """Factory for creating households."""
    def _make(name="Test Household"):
        with app.app_context():
            household = Household(name=name)
            _db.session.add(household)
            _db.session.commit()
            return household
    return _make


@pytest.fixture()
def make_announcement(app):
    """Factory for creating announcements."""
    def _make(user_id, household_id, message="Test announcement", is_important=False):
        with app.app_context():
            announcement = Announcement(
                user_id=user_id,
                household_id=household_id,
                message=message,
                is_important=is_important,
                created_at=datetime.now(timezone.utc),
            )
            _db.session.add(announcement)
            _db.session.commit()
            return announcement
    return _make


@pytest.fixture()
def make_seen(app):
    """Factory for marking an announcement as seen by a user."""
    def _make(announcement_id, user_id):
        with app.app_context():
            seen = AnnouncementSeen(
                announcement_id=announcement_id,
                user_id=user_id,
            )
            _db.session.add(seen)
            _db.session.commit()
            return seen
    return _make



# Convenience fixtures

@pytest.fixture()
def household(make_household):
    return make_household()


@pytest.fixture()
def sara(make_user, household):
    return make_user(first_name="Sara", email="sara@test.com", household_id=household.id)


@pytest.fixture()
def john(make_user, household):
    return make_user(first_name="John", email="john@test.com", household_id=household.id)