from app.extensions import db
from sqlalchemy import CheckConstraint, Index, inspect  # Add inspect here
from app.models.todo_list_member import TodoListMember
from app.models.todo import Todo  # Add this import
from enum import Enum

class ViewMode(str, Enum):
    REGULAR = 'regular'
    COMPACT = 'compact'

class NewItemPosition(str, Enum):
    TOP = 'top'
    BOTTOM = 'bottom'

class SortOrder(str, Enum):
    DUE_DATE = 'due_date'
    IMPORTANCE = 'importance'
    ALPHABETICAL = 'alphabetical'
    NEWEST = 'newest'

class FilterType(str, Enum):
    IMPORTANCE = 'importance'
    MEMBER = 'member'
    DUE_DATE = 'due_date'


class TodoList(db.Model):
    __tablename__ = "todo_lists"

    id = db.Column(db.Integer, primary_key=True)

    # Basic Info
    title = db.Column(db.String(64), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    household_id = db.Column(db.Integer, db.ForeignKey("households.id"), nullable=True)
    all_members = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    # Appearance
    icon = db.Column(db.String(120), nullable=True)
    color = db.Column(db.String(7), default="#050549")
    view_mode = db.Column(db.String(20), default=ViewMode.REGULAR.value)

    # Defaults
    default_sort_order = db.Column(db.String(30), nullable=True)
    default_filters = db.Column(db.JSON, nullable=True)

    # List status
    is_archived = db.Column(db.Boolean, default=False, nullable=False)

    # Misc.
    new_item_position = db.Column(db.String(10), default=NewItemPosition.BOTTOM.value)
    auto_hide_when_empty = db.Column(db.Boolean, default=False)

    # Relationships
    todos = db.relationship(
        "Todo",
        back_populates="todo_list",
        cascade="all, delete-orphan"  # optional but handy
    )
    user = db.relationship("User", back_populates="todo_lists")
    household = db.relationship("Household", back_populates="todo_lists")
    member_links = db.relationship(
        "TodoListMember", 
        back_populates="todo_list", 
        cascade="all, delete-orphan", 
        lazy="selectin"
    )
    members = db.relationship(
        "User", 
        secondary=lambda: TodoListMember.__table__, 
        back_populates="lists_participating", 
        lazy="selectin", 
        viewonly=True
    )

    __table_args__ = (
        # XOR: exactly one of user_id / household_id must be non-null
        CheckConstraint(
            "(user_id IS NOT NULL) <> (household_id IS NOT NULL)",
            name="ck_todo_lists_exactly_one_owner",
        ),
        # Unique title per owner (fix: use 'title', not 'name')
        Index("ix_todo_lists_user_id", "user_id"),
        Index("ix_todo_lists_household_id", "household_id"),
    )

    @property
    def scope(self) -> str:
        return "user" if self.user_id is not None else "household"

    def audience_user_ids(self):
        """Who should see this list?"""
        if self.user_id is not None:
            return [self.user_id]
        if self.all_members:
            # assumes Household.members is defined
            return [m.id for m in (self.household.members or [])]
        return [link.user_id for link in self.member_links]

    def duplicate(self):
        """Create an exact copy of this list with all settings and members the same"""
        from copy import deepcopy

        duplicate = TodoList(
            title=f"{self.title} (Copy)",
            icon=self.icon,
            color=self.color,
            view_mode=self.view_mode,
            new_item_position=self.new_item_position,
            auto_hide_when_empty=self.auto_hide_when_empty,
            default_sort_order=self.default_sort_order,
            default_filters=deepcopy(self.default_filters) if self.default_filters else None,
            user_id=self.user_id,
            household_id=self.household_id,
            all_members=self.all_members
        )

        db.session.add(duplicate)
        db.session.flush()

        # Duplicate member assignments (if not all_members)
        if not self.all_members:
            for member_link in self.member_links:
                new_link = TodoListMember(
                    list_id=duplicate.id,
                    user_id=member_link.user_id
                )
                db.session.add(new_link)

        # Duplicate tasks, but with new ids, createdAts, updatedAts, and listIds
        for todo in self.todos:
            new_todo = Todo()
            for col in inspect(Todo).columns:
                if col.key in {"id", "created_at", "updated_at", "list_id"}:
                    continue
                setattr(new_todo, col.key, getattr(todo, col.key))
            new_todo.list_id = duplicate.id
            db.session.add(new_todo)
        
        return duplicate

    def to_dict(self, include_todos: bool = True, include_members: bool = True):
        return {
            "id": self.id,
            "title": self.title,
            "icon": self.icon,
            "color": self.color,
            "viewMode": self.view_mode,
            "newItemPosition": self.new_item_position,
            "autoHideWhenEmpty": self.auto_hide_when_empty,
            "isArchived": self.is_archived,
            "defaultSortOrder": self.default_sort_order,
            "defaultFilters": self.default_filters,
            "userId": self.user_id,
            "householdId": self.household_id,
            "scope": self.scope,
            "allMembers": self.all_members,
            "memberIds": self.audience_user_ids() if include_members else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "todos": [t.to_dict() for t in self.todos] if include_todos else [],
        }

    def __repr__(self):
        return f"<TodoList id={self.id} title={self.title!r} scope={self.scope} all_members={self.all_members}>"

