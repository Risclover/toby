from app.models.notification import Notification, NotificationEntity, NotificationType


def test_enum_names_fit_their_columns():
    """Every type and entity name fits its VARCHAR column, which SQLite ignores but Postgres enforces"""
    type_length = Notification.__table__.c.type.type.length
    entity_length = Notification.__table__.c.entity_type.type.length

    assert all(len(member.name) <= type_length for member in NotificationType)
    assert all(len(member.name) <= entity_length for member in NotificationEntity)