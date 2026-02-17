from app.extensions import db
from enum import Enum

class FeaturedTasklistRotation(str, Enum):
    MANUAL = "manual"
    AUTO_ROTATE = "auto_rotate"
    MOST_DUE_SOON = "most_due_soon"

class TaskAssigneeFilter(str, Enum):
    JUST_ME = "just_me"
    ALL_TASKS = "all_tasks"

class TaskUrgencyFilter(str, Enum):
    ALL = "all"
    OVERDUE_ONLY = "overdue_only"
    DUE_TODAY = "due_today"
    DUE_THIS_WEEK = "due_this_week"

class FeaturedTaskSortOrder(str, Enum):
    DUE_DATE = "due_date"
    IMPORTANCE = "importance"
    MANUAL = "manual"
    NEWEST = "neweset"
    OLDEST = "oldest"
    ALPHABETICAL = "alphabetical"

class FeaturedListView(str, Enum):
    DETAILED = "detailed"
    COMPACT = "compact"


class UserSetting(db.Model):
    __tablename__ = "user_settings"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)

    # Featured tasklist settings
    featured_tasklist_rotation = db.Column(db.Enum(FeaturedTasklistRotation), default=FeaturedTasklistRotation.AUTO_ROTATE, nullable=False)
    featured_tasklist_assignee_filter = db.Column(db.Enum(TaskAssigneeFilter), default=TaskAssigneeFilter.ALL_TASKS, nullable=False)
    featured_tasklist_urgency_filter = db.Column(db.Enum(TaskUrgencyFilter), default=TaskUrgencyFilter.ALL, nullable=False)
    featured_tasklist_important_only = db.Column(db.Boolean, default=False)
    featured_tasklist_max_items = db.Column(db.Integer, default=5, nullable=False)
    featured_tasklist_show_completed = db.Column(db.Boolean, default=False)
    featured_tasklist_sort_order = db.Column(db.Enum(FeaturedTaskSortOrder), default=FeaturedTaskSortOrder.DUE_DATE, nullable=False)
    featured_tasklist_view = db.Column(db.Enum(FeaturedListView), default=FeaturedListView.COMPACT, nullable=False)
    featured_tasklist_show_progress = db.Column(db.Boolean, default=False)
    featured_tasklist_show_quick_add = db.Column(db.Boolean, default=False)

    # Relationship
    user = db.relationship("User", back_populates="settings", uselist=False)

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "featuredTasklist": {
                "rotation": self.featured_tasklist_rotation,
                "assigneeFilter": self.featured_tasklist_assignee_filter,
                "urgencyFilter": self.featured_tasklist_urgency_filter,
                "importantOnly": self.featured_tasklist_important_only,
                "maxItems": self.featured_tasklist_max_items,
                "showCompleted": self.featured_tasklist_show_completed,
                "sortOrder": self.featured_tasklist_sort_order,
                "view": self.featured_tasklist_view,
                "showProgress": self.featured_tasklist_show_progress,
                "showQuickAdd": self.featured_tasklist_show_quick_add
            }
        }