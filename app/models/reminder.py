from sqlalchemy import func, Index, UniqueConstraint
from app.extensions import db
from datetime import datetime
from enum import Enum

class ReminderType(Enum):
    custom = "custom"
    task_due = "task_due"
    event_starting = "event_starting"
    daily_check_in_missing = "daily_check_in_missing"

class Reminder(db.Model):
    __tablename__ = "reminders"

    id = db.Column(db.Integer, primary_key=True)

    # Foreign keys
    household_id = db.Column(db.Integer, db.ForeignKey("households.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # Core details
    title = db.Column(db.String(50), nullable=True)
    body = db.Column(db.Text, nullable=False)
    reminder_type = db.Column(db.Enum(ReminderType), nullable=False)
    is_automatic = db.Column(db.Boolean, nullable=False, default=False)

    # Source entity (if applicable)
    source_entity_id = db.Column(db.Integer, nullable=True)
    source_entity_type = db.Column(db.String(50), nullable=True)

    # Timestamps
    due_at = db.Column(db.DateTime(timezone=True), nullable=True, index=True)
    trigger_at = db.Column(db.DateTime(timezone=True), nullable=True, index=True)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=True, index=True)

    # Creation and update tracking
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    created_by = db.relationship("User", foreign_keys=[created_by_id])
    household = db.relationship("Household", back_populates="reminders")
    assignments = db.relationship("ReminderAssignment", cascade="all, delete-orphan", backref="reminder")

    __table_args__ = (
        UniqueConstraint(
            "household_id",
            "source_entity_type",
            "source_entity_id",
            name="uq_reminder_source_entity",
        ),
    )
    
    def to_dict(self):
        return {
            "id": self.id,
            "householdId": self.household_id,
            "createdById": self.created_by_id,
            "title": self.title,
            "body": self.body,
            "reminderType": self.reminder_type.value,  # ✅ Use .value
            "isAutomatic": self.is_automatic,
            "sourceEntityId": self.source_entity_id,
            "sourceEntityType": self.source_entity_type,
            "dueAt": self.due_at.isoformat() if self.due_at else None,
            "triggerAt": self.trigger_at.isoformat() if self.trigger_at else None,
            "expiresAt": self.expires_at.isoformat() if self.expires_at else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "createdBy": {
                "id": self.created_by.id,
                "firstName": self.created_by.first_name,
                "profileImg": self.created_by.profile_img,
            } if self.created_by else None,
            "assignedTo": [
                {
                    "id": a.user.id,
                    "firstName": a.user.first_name,
                    "profileImg": a.user.profile_img,
                }
                for a in self.assignments
            ],
        }

    def to_dict_for_user(self, assignment):
        """
        Returns a JSON-safe version for a specific user's view of this reminder.
        """
        return {
            "id": self.id,
            "householdId": self.household_id,
            "createdById": self.created_by_id,
            "title": self.title,
            "body": self.body,
            "reminderType": self.reminder_type.value,  # ✅ Use .value
            "isAutomatic": self.is_automatic,
            "sourceEntityId": self.source_entity_id,
            "sourceEntityType": self.source_entity_type,
            "dueAt": self.due_at.isoformat() if self.due_at else None,
            "triggerAt": self.trigger_at.isoformat() if self.trigger_at else None,
            "expiresAt": self.expires_at.isoformat() if self.expires_at else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "createdBy": {
                "id": self.created_by.id,
                "firstName": self.created_by.first_name,
                "profileImg": self.created_by.profile_img,
            } if self.created_by else None,
            "assignedTo": [
                {
                    "id": a.user.id,
                    "firstName": a.user.first_name,
                    "profileImg": a.user.profile_img,
                }
                for a in self.assignments
            ],
            "currentUserAssignment": {
                "seen": assignment.seen
            }
        }
    
    def __repr__(self):
        return f"<Reminder id={self.id} household_id={self.household_id} created_by_id={self.created_by_id}>"

class ReminderAssignment(db.Model):
    __tablename__ = "reminder_assignments"

    reminder_id = db.Column(db.Integer, db.ForeignKey("reminders.id", ondelete="CASCADE"), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    assigned_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    seen = db.Column(db.Boolean, nullable=False, default=False)

    def to_dict(self):
        return {
            "reminderId": self.reminder_id,
            "userId": self.user_id,
            "seen": self.seen,
            "assignedAt": self.assigned_at.isoformat(),
        }