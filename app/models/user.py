from app.extensions import db
from flask_login import UserMixin, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.tasklist_member import TasklistMember
from sqlalchemy import Index

def default_display(context):
    return context.get_current_parameters()['first_name']

class User(db.Model, UserMixin):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(20), nullable=False)
    last_name = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    hashed_password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    display_name = db.Column(db.String(30), default=default_display, nullable=True)
    tagline = db.Column(db.String(100), nullable=True)
    profile_img = db.Column(db.String(256), default="https://i.imgur.com/DRsIsR4.png")
    banner_img = db.Column(db.String(256), nullable=True)
    timezone = db.Column(db.String, nullable=False, default="UTC")
    points = db.Column(db.Integer, default=0)
    daily_checkin = db.Column(db.Boolean, default=False, nullable=False)
    last_checkin = db.Column(db.DateTime, nullable=True)
    household_id = db.Column(db.Integer, db.ForeignKey("households.id"), nullable=True)
    featured_tasklist_id = db.Column(db.Integer, db.ForeignKey("tasklists.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    user_mood = db.relationship(
        "Mood",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )    
    household = db.relationship(
        "Household",
        back_populates="members",
        foreign_keys=[household_id]  # explicitly point to household_id
    )
    tasklist_memberships = db.relationship("TasklistMember", back_populates="user", cascade="all, delete-orphan")
    lists_participating = db.relationship(
    "Tasklist",
    secondary=lambda: TasklistMember.__table__,  # ✅ a Table
    back_populates="members",
    lazy="selectin",
    viewonly=True,  # write via TasklistMember rows
    )

    # habits = db.relationship("HabitLog", back_populates="habit_user")
    featured_tasklist = db.relationship(
        'Tasklist', 
        foreign_keys=[featured_tasklist_id],
        # No backref here, let's keep this one-way for now to simplify
    )

    tasklists = db.relationship(
        'Tasklist', 
        foreign_keys='Tasklist.user_id', 
        back_populates='user' # Changed from backref to match the Tasklist model
    )
    archived_lists = db.relationship(
        "Tasklist",
        foreign_keys="[Tasklist.archived_by]",
        back_populates="archiver"
    )

    # 3. Same here, references the Task model's foreign key
    tasks = db.relationship(
        "Task",
        foreign_keys="Task.assigned_to_id",
        back_populates="assigned_to"
    )

    # Add the reverse for created tasks (matches back_populates="created_tasks" in Task)
    created_tasks = db.relationship(
        "Task",
        foreign_keys="Task.creator_id",
        back_populates="creator"
    )

    reminder_assignments = db.relationship("ReminderAssignment", cascade="all, delete-orphan", backref="user")
    reminders = db.relationship("Reminder", secondary="reminder_assignments", viewonly=True)
    # projects = db.relationship("ProjectMember", back_populates="user")
    # moods = db.relationship("MoodCheckin", back_populates="user")

    # Password management
    @property
    def password(self):
        return self.hashed_password

    @password.setter
    def password(self, password):
        self.hashed_password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    # Convert to dict for JSON
    def to_dict(self):
        return {
            "id": self.id,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "email": self.email,
            "createdAt": self.created_at,
            "displayName": self.display_name,
            "tagline": self.tagline,
            "profileImg": self.profile_img,
            "bannerImg": self.banner_img,
            "points": self.points,
            "dailyCheckin": self.daily_checkin,
            "lastCheckin": self.last_checkin,
            "timezone": self.timezone,
            "householdId": self.household_id,
            "featuredTasklistId": self.featured_tasklist_id,
            "reminders": [
                assignment.reminder.to_dict_for_user(assignment)
                for assignment in self.reminder_assignments
            ]
        }

    def to_dict_with_mood(self):
        return {
            "userId": self.id,
            "firstName": self.first_name,
            "profileImg": self.profile_img,
            "mood": (str(self.user_mood.mood) if self.user_mood else None),
        }

    def __repr__(self):
        return f"<User {self.id}: {self.first_name}>"
