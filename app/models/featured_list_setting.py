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
    NEWEST = "newest"
    OLDEST = "oldest"
    ALPHABETICAL = "alphabetical"

class FeaturedListView(str, Enum):
    DETAILED = "detailed"
    COMPACT = "compact"

class NewItemPosition(str, Enum):
    TOP = 'top'
    BOTTOM = 'bottom'


class FeaturedListSetting(db.Model):
    __tablename__ = "featured_list_settings"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)

    # Featured tasklist settings
    tasklist_id = db.Column(db.Integer, db.ForeignKey("tasklists.id", ondelete="SET NULL"), nullable=True)
    filter_just_me = db.Column(db.Boolean, default=False)
    filter_overdue = db.Column(db.Boolean, default=False)
    filter_due_today = db.Column(db.Boolean, default=False)
    filter_due_soon = db.Column(db.Boolean, default=False)
    important_only = db.Column(db.Boolean, default=False)
    max_items = db.Column(db.Integer, default=5, nullable=False)
    show_completed = db.Column(db.Boolean, default=False)
    sort_order = db.Column(db.Enum(FeaturedTaskSortOrder), default=FeaturedTaskSortOrder.DUE_DATE, nullable=False)
    view = db.Column(db.Enum(FeaturedListView), default=FeaturedListView.COMPACT, nullable=False)
    show_progress = db.Column(db.Boolean, default=False)
    show_quick_add = db.Column(db.Boolean, default=False)

    # Relationship
    user = db.relationship("User", back_populates="featured_list_settings", uselist=False)
    featured_tasklist = db.relationship("Tasklist", foreign_keys=[tasklist_id], uselist=False)

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "featuredTasklist": {
                "tasklistId": self.tasklist_id,
                "justMeFilter": self.filter_just_me,
                "urgencyFilter": {
                    "overdue": self.filter_overdue,
                    "dueToday": self.filter_due_today,
                    "dueSoon": self.filter_due_soon
                },
                "importantOnly": self.important_only,
                "maxItems": self.max_items,
                "showCompleted": self.show_completed,
                "sortOrder": self.sort_order,
                "view": self.view,
                "showProgress": self.show_progress,
                "showQuickAdd": self.show_quick_add,
            }
        }