from app.extensions import db 
from enum import Enum

class Theme(str, Enum):
    LIGHT = "light"
    DARK = "dark"
    SYSTEM = "system"

class PrivacyMode(str, Enum):
    NORMAL = "normal"
    ALL_PRIVATE = "all_private"
    PRIVATE_BY_DEFAULT = "private_by_default"

class UserSettings(db.Model):
    __tablename__ = "user_settings"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    site_theme = db.Column(db.Enum(Theme), default=Theme.SYSTEM, nullable=False)
    habits_on_homepage = db.Column(db.Boolean, default=False, nullable=False)
    habits_privacy_mode = db.Column(db.Enum(PrivacyMode), default=PrivacyMode.NORMAL, nullable=False)
    notes_privacy_mode = db.Column(db.Enum(PrivacyMode), default=PrivacyMode.NORMAL, nullable=False)
    events_privacy_mode = db.Column(db.Enum(PrivacyMode), default=PrivacyMode.NORMAL, nullable=False)

    user = db.relationship("User", back_populates="user_settings", uselist=False)

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "habitsOnHomepage": self.habits_on_homepage,
            "siteTheme": self.site_theme.value if self.site_theme else None,
            "habitsPrivacyMode": self.habits_privacy_mode.value,
            "notesPrivacyMode": self.notes_privacy_mode.value,
            "eventsPrivacyMode": self.events_privacy_mode.value,
        }