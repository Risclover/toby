from datetime import datetime, timezone
from app.extensions import db
from app.models import User
 
PRESET_USER_COLORS = [
    "#fa5252", "#e64980", "#be4bdb", "#7950f2", "#fd7e14",
    "#228be6", "#15aabf", "#12b886", "#40c057", "#fab005",
    "#2e2e2e",
]

DEFAULT_ACCENT_COLOR = "#868e96"
VALID_VISIBILITIES = {"public", "private"}
DEFAULT_VISIBILITY = "public"
 
 
def assign_user_color(household_id: int) -> str:
    """Returns an unused color from PRESET_USER_COLORS for this household.
 
    Looks at colors CURRENTLY in use, not a count/index -- that matters
    because a count-based "next in line" approach breaks once anyone has ever
    left the household: the count no longer reflects which colors are
    actually taken, so a new member could collide with an existing one.
    Querying actual current colors is correct regardless of past joins/leaves.
 
    Call this wherever you currently create a User row.
    """
    used = {u.color for u in User.query.filter_by(household_id=household_id).all()}
 
    for color in PRESET_USER_COLORS:
        if color not in used:
            return color
 
    raise ValueError(
        f"No unused preset color left for household {household_id} "
        f"({len(used)} members, {len(PRESET_USER_COLORS)} colors available)"
    )
 
 
class Event(db.Model):
    __tablename__ = "events"
 
    id = db.Column(db.Integer, primary_key=True)
    household_id = db.Column(db.Integer, db.ForeignKey("households.id"), nullable=False)
    creator_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    start_utc = db.Column(db.DateTime(timezone=True), nullable=True)
    end_utc = db.Column(db.DateTime(timezone=True), nullable=True)
    has_time = db.Column(db.Boolean, nullable=False, default=False)
    visibility = db.Column(db.String(10), nullable=False, default=DEFAULT_VISIBILITY)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    tzid = db.Column(db.String(64), nullable=False)  # e.g. "America/Los_Angeles"

    rrule = db.Column(db.String(255), nullable=True)
    all_members = db.Column(db.Boolean, default=False, nullable=False)
    
    household = db.relationship("Household", backref=db.backref("events", lazy="dynamic"))
    event_creator = db.relationship("User", foreign_keys=[creator_id])

    attendee_links = db.relationship(
        "EventAttendee",
        backref="event",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
 
    @property
    def attendees(self):
        """List of User objects assigned to this event."""
        return [link.user for link in self.attendee_links]
 
    def to_dict(self):
        def to_utc_z(dt):
            if dt is None:
                return None
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
 
        attendees = self.attendees
        return {
            "id": self.id,
            "householdId": self.household_id,
            "creatorId": self.creator_id,
            "title": self.title,
            "startUtc": to_utc_z(self.start_utc),
            "endUtc": to_utc_z(self.end_utc),
            "tzid": self.tzid,
            "hasTime": bool(self.has_time),
            "rrule": self.rrule,
            "visibility": self.visibility,
            "createdAt": to_utc_z(self.created_at),
            "attendees": [
                {"id": u.id, "name": getattr(u, "name", None), "color": u.color}
                for u in attendees
            ],
            "allMembers": self.all_members,
            "attendeeIds": [u.id for u in attendees],
            "household": {
                "id": self.household.id,
                "adminId": self.household.admin_id,
            },
        }
 
    def __repr__(self):
        return f"Event {self.id}: {self.title}"
