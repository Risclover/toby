from app.extensions import db 

class ActivityType(str, Enum):
    # Tasks & Lists 
    TASK_CREATED = "TASK_CREATED" # Sara added a task to "Groceries": "Buy Milk:"
    TASK_COMPLETED = "TASK_COMPLETED" # John completed task: "Vaccuum"
    TASK_REOPENED = "TASK_REOPENED" # John reopened task: "Vaccuum"
    TASK_ASSIGNED = "TASK_ASSIGNED" # Sara assigned "Dishes" to John
    TASK_UNASSIGNED = "TASK_UNASSIGNED" # Sara unassigned "Dishes"
    TASK_DUE_DATE_SET = "TASK_DUE_DATE_SET" # Sara set due date for "Trash" to Tomorrow
    TASK_DUE_DATE_CHANGED = "TASK_DUE_DATE_CHANGED" # Sara moved due date for "Trash" to Fri, Sep 26
    TASK_DUE_DATE_CLEARED = "TASK_DUE_DATE_CLEARED" # Sara cleared due date for "Trash"
    TASK_REORDERED = "TASK_REORDERED" # Sara reordered tasks in "Weekend Chores"
    TASK_BULK_COMPLETED = "TASK_BULK_COMPLETED" # John completed 5 tasks in "Kitchen"
    LIST_CREATED = "LIST_CREATED" # Sara created list: "Fall Cleanup"
    LIST_RENAMED = "LIST_RENAMED" # Sara renamed list "Fall Cleanup" to "Yard Cleanup"
    LIST_ARCHIVED = "LIST_ARCHIVED" # Sara archived list: "Garage"
    LIST_UNARCHIVED = "LIST_UNARCHIVED" # Sara unarchived list: "Garage"
    SUBTASK_ADDED = "SUBTASK_ADDED" # Sara added a subtask to "Party prep": "Buy cups"
    SUBTASK_COMPLETED = "SUBTASK_COMPLETED" # John completed subtask: "Buy cups"

    # Calendar & Announcements
    EVENT_SCHEDULED = "EVENT_SCHEDULED" # Sara scheduled an event for Sat, Sep 20: "Dentist"
    EVENT_UPDATED = "EVENT_UPDATED" # Sara updated event "Dentist"
    EVENT_RESCHEDULED = "EVENT_RESCHEDULED" # Sara moved "Dentist" to Mon, Sep 22
    EVENT_CANCELLED = "EVENT_CANCELLED" # Sara canceled "Dentist"
    ANNOUNCEMENT_CREATED = "ANNOUNCEMENT_CREATED" # John created an announcement
    ANNOUNCEMENT_PINNED = "ANNOUNCEMENT_PINNED" # Sara pinned an announcement

    # Checkins, Habits, Goals
    CHECKIN = "CHECKIN" # Sara checked in
    CHECKIN_MISSED = "CHECKIN_MISSED" # John missed yesterday's check-in
    HABIT_CREATED = "HABIT_CREATED" # Sara created new habit: "Walk 20 min"
    HABIT_MARKED = "HABIT_MARKED" # Sara marked habit "Walk 20 min"
    HABIT_STREAK_STARTED = "HABIT_STREAK_STARTED" # Sara started a 3-day streak on "Meditate"
    HABIT_STREAK_BROKEN = "HABIT_STREAK_BROKEN" # John broke his "No soda" streak
    GOAL_CREATED = "GOAL_CREATED" # Sara created goal: "$1,000 Emergency Fund"
    GOAL_PROGRESS_UPDATED = "GOAL_PROGRESS_UPDATED" # Sara updated progress on "Emergency Fund" (40%)
    GOAL_COMPLETED = "GOAL_COMPLETED" # Sara completed goal "Emergency Fund"

    # Shopping & Projects
    SHOP_ITEM_ADDED = "SHOP_ITEM_ADDED" # Sara added item to Shopping List: "Eggs"
    SHOP_ITEM_UPDATED = "SHOP_ITEM_UPDATED" # Sara updated "Eggs" quantity to 3
    SHOP_ITEM_CHECKED = "SHOP_ITEM_CHECKED" # John checked off "Eggs"
    SHOP_LIST_CLEARED = "SHOP_LIST_CLEARED" # Sara cleared purchased items
    PROJECT_CREATED = "PROJECT_CREATED" # Sara created project: "Bedroom Makeover"
    
    # Money (Bills/Budget)
    BILL_ADDED = "BILL_ADDED" # Sara added bill "PG&E" due Fri, Sep 26
    BILL_PAID = "BILL_PAID" # John marked "PG&E" as paid ($120)
    BUDGET_CATEGORY_UPDATED = "BUDGET_CATEGORY_UPDATED" # Sara set Groceries budget to $100

    # Household Membership
    MEMBER_JOINED = "MEMBER_JOINED" # Emily joined the household
    MEMBER_LEFT = "MEMBER_LEFT" # Emily left the household

    # Reminders & Chores
    REMINDER_CREATED = "REMINDER_CREATED" # Sara set a reminder: "Water plants"
    CHORE_ASSIGNED = "CHORE_ASSIGNED" # Sara assigned "Trash" to Sara

class Activity(db.Model):
    __tablename__ = "activity"

    id = db.Column(db.Integer, primary_key=True)
    household_id = db.Column(db.Integer, db.ForeignKey("households.id"), nullable=False)
    actor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    actor_name = db.Column(db.String(120), nullable=False)
    type = db.Column(SAEnum(ActivityType), nullable=False)

    object_type = db.Column(db.String(50)) # e.g. 'task', 'event', 'announcement', 'list'
    object_id = db.Column(db.Integer)
    target_type = db.Column(db.String(50)) # e.g. 'list'
    target_id = db.Column(db.Integer)

    # Snapshot strings so the feed stays stable if stuff gets renamed/deleted
    object_title = db.Column(db.String(255))
    target_title = db.Column(db.String(255))

    # for events
    event_start_at = db.Column(db.DateTime(timezone=True))
    event_tzid = db.Column(db.String(64))

    created_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=func.now())
    
    __table_args__ = (
        # Fast household feed lookup, newest first
        Index("ix_activities_household_created_desc", "household_id", "created_at", "id"),
    )

    def to_rendered(self):
        base = {
            "id": self.id,
            "householdId": self.household_id,
            "actor": { "id": self.actor_id, "name": self.actor_name },
            "type": self.type.value,
            "createdAt": self.created_at.isoformat(),
            "object": {
                "type": self.object_type,
                "id": self.object_id,
                "title": self.object_title 
            },
            "target": {
                "type": self.target_type,
                "id": self.target_id,
                "title": self.target_title 
            },
            "event": {
                "startAt": self.event_start_at.isoformat() if self.event_start_at else None,
                "tzid": self.event_tzid
            }
        }

        # Simple server-size templates (remember to tweak)
        if self.type == ActivityType.TASK_CREATED:
            text = f'{self.actor_name} added a task to "{self.target_title}": "{self.object_title}"'
        elif self.type == ActivityType.TASK_COMPLETED:
            text = f'{self.actor_name} completed task: "{self.object_title}"'
        elif self.type == ActivityType.