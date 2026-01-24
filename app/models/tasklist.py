from copy import deepcopy
from enum import Enum

from sqlalchemy import CheckConstraint, Index, inspect
from app.extensions import db
from app.models.tasklist_member import TasklistMember
from app.models.task import Task
from flask_login import current_user


class ViewMode(str, Enum):
    DETAILED = 'detailed'
    COMPACT = 'compact'


class NewItemPosition(str, Enum):
    TOP = 'top'
    BOTTOM = 'bottom'


class SortOrder(str, Enum):
    DUE_DATE = 'due_date'
    IMPORTANCE = 'importance'
    ALPHABETICAL = 'alphabetical'
    NEWEST = 'newest'
    OLDEST = 'oldest'


class FilterType(str, Enum):
    IMPORTANCE = 'importance'
    MEMBER = 'member'
    DUE_DATE = 'due_date'


class DuplicateMode(str, Enum):
    ONLY_UNCOMPLETE = 'only_uncomplete'
    ALL_PRESERVE = 'all_preserve'
    ALL_RESET = 'all_reset'


DEFAULT_TASKLIST_FILTERS = {
    "importance": "all",
    "assignedToId": None,
    "time": "all",
}


class Tasklist(db.Model):
    __tablename__ = "tasklists"

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
    color = db.Column(db.String(7), default="#15aabf")
    view_mode = db.Column(db.String(20), default=ViewMode.DETAILED.value)

    # Defaults
    default_sort_order = db.Column(db.String(30), nullable=True)
    default_filters = db.Column(
        db.JSON,
        nullable=False,
        default=lambda: DEFAULT_TASKLIST_FILTERS.copy()
    )
 
    # List status
    is_archived = db.Column(db.Boolean, default=False, nullable=False)

    # Layout
    show_completed = db.Column(db.Boolean, default=False)
    new_item_position = db.Column(db.String(10), default=NewItemPosition.BOTTOM.value)

    # Relationships
    tasks = db.relationship(
        "Task",
        back_populates="tasklist",
        cascade="all, delete-orphan"
    )
    user = db.relationship(
        "User", 
        foreign_keys=[user_id],  # This tells Tasklist which FK to use for 'owner'
        back_populates="tasklists" # Use back_populates instead of backref for clarity
    )
    household = db.relationship("Household", back_populates="tasklists")
    member_links = db.relationship(
        "TasklistMember", 
        back_populates="tasklist", 
        cascade="all, delete-orphan", 
        lazy="selectin"
    )
    members = db.relationship(
        "User", 
        secondary=lambda: TasklistMember.__table__, 
        back_populates="lists_participating", 
        lazy="selectin", 
        viewonly=True
    )

    __table_args__ = (
        # XOR: exactly one of user_id / household_id must be non-null
        CheckConstraint(
            "(user_id IS NOT NULL) <> (household_id IS NOT NULL)",
            name="ck_tasklists_exactly_one_owner",
        ),
        # Unique title per owner
        Index("ix_tasklists_user_id", "user_id"),
        Index("ix_tasklists_household_id", "household_id"),
    )

    @property
    def scope(self) -> str:
        return "user" if self.user_id is not None else "household"

    def audience_user_ids(self):
        if self.household_id is not None:
            # FIX: Check the flag before returning everyone
            if self.all_members:
                return [m.id for m in (self.household.members or [])]
            
            # If not all members, return only the assigned ones
            return [link.user_id for link in self.member_links]

        # 1. Personal lists: Only the owner
        if self.user_id is not None:
            return [self.user_id]
    
        return []

    def duplicate(self, mode: DuplicateMode = DuplicateMode.ALL_PRESERVE):
        """
        Create a copy of this list based on the selected mode [memory:1].
        
        Args:
            mode (DuplicateMode): 
                - ONLY_UNCOMPLETE: Copy only uncompleted tasks.
                - ALL_PRESERVE: Copy all tasks, keeping their completion status.
                - ALL_RESET: Copy all tasks, but mark them all as uncompleted.
        """
        duplicate = Tasklist(
            title=f"{self.title} (Copy)",
            icon=self.icon,
            color=self.color,
            show_completed=self.show_completed,
            view_mode=self.view_mode,
            new_item_position=self.new_item_position,
            default_sort_order=self.default_sort_order,
            default_filters=deepcopy(self.default_filters) if self.default_filters else None,
            user_id=self.user_id,
            household_id=self.household_id,
            all_members=self.all_members,
        )

        db.session.add(duplicate)
        db.session.flush()

        # Duplicate member assignments (if not all_members)
        if not self.all_members:
            for member_link in self.member_links:
                new_link = TasklistMember(
                    list_id=duplicate.id,
                    user_id=member_link.user_id
                )
                db.session.add(new_link)

        # Duplicate tasks
        for task in self.tasks:
            # 1. Handle "only uncomplete tasks"
            # Note: Verify your Task model uses 'is_complete'. If it uses 'status' or 'completed', update below.
            if mode == DuplicateMode.ONLY_UNCOMPLETE and getattr(task, 'is_complete', False):
                continue

            new_task = Task()
            for col in inspect(Task).columns:
                if col.key in {"id", "created_at", "updated_at", "list_id"}:
                    continue
                setattr(new_task, col.key, getattr(task, col.key))
            
            # 2. Handle "all tasks, without completed status"
            if mode == DuplicateMode.ALL_RESET:
                if hasattr(new_task, 'is_complete'):
                    new_task.is_complete = False
            
            new_task.list_id = duplicate.id
            db.session.add(new_task)
        
        return duplicate

    def to_dict(self, include_tasks: bool = True, include_members: bool = True):
        try:
            viewer = current_user
        except:
            viewer = self.user
        return {
            "id": self.id,
            "title": self.title,
            "icon": self.icon,
            "color": self.color,
            "showCompleted": self.show_completed,
            "viewMode": self.view_mode,
            "newItemPosition": self.new_item_position,
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
            "tasks": [t.to_dict() for t in self.tasks] if include_tasks else [],
            "isFeatured": self.id == viewer.featured_tasklist_id if (viewer and hasattr(viewer, 'featured_tasklist_id')) else False
        }

    def __repr__(self):
        return f"<Tasklist id={self.id} title={self.title!r} scope={self.scope} all_members={self.all_members}>"
