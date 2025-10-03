from app.extensions import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.todo_list_member import TodoListMember
from sqlalchemy import Index

def default_display(context):
    return context.get_current_parameters()['name']

class User(db.Model, UserMixin):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    hashed_password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    display_name = db.Column(db.String(30), default=default_display, nullable=True)
    tagline = db.Column(db.String(100), nullable=True)
    profile_img = db.Column(db.String(256), default="https://i.imgur.com/DRsIsR4.png")
    banner_img = db.Column(db.String(256), nullable=True)
    points = db.Column(db.Integer, default=0)
    daily_checkin = db.Column(db.Boolean, default=False, nullable=False)
    last_checkin = db.Column(db.DateTime, nullable=True)
    household_id = db.Column(db.Integer, db.ForeignKey("households.id"), nullable=True)

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
    todo_list_memberships = db.relationship("TodoListMember", back_populates="user", cascade="all, delete-orphan")
    lists_participating = db.relationship(
    "TodoList",
    secondary=lambda: TodoListMember.__table__,  # ✅ a Table
    back_populates="members",
    lazy="selectin",
    viewonly=True,  # write via TodoListMember rows
)

    # habits = db.relationship("HabitLog", back_populates="habit_user")
    todo_lists = db.relationship("TodoList", back_populates="user")
    todos = db.relationship("Todo", back_populates="assigned_to")
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
            "name": self.name,
            "email": self.email,
            "createdAt": self.created_at,
            "displayName": self.display_name,
            "tagline": self.tagline,
            "profileImg": self.profile_img,
            "bannerImg": self.banner_img,
            "points": self.points,
            "dailyCheckin": self.daily_checkin,
            "lastCheckin": self.last_checkin,
            "householdId": self.household_id
        }

    def to_dict_with_mood(self):
        return {
            "userId": self.id,
            "name": self.name,
            "profileImg": self.profile_img,
            "mood": (str(self.user_mood.mood) if self.user_mood else None),
        }

    def __repr__(self):
        return f"<User {self.id}: {self.name}>"
