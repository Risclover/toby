from app.extensions import db 
from datetime import datetime, timezone 

class Event(db.Model):
    __tablename__ = "events"

    id = db.Column(db.Integer, primary_key=True)
    household_id = db.Column(db.Integer, db.ForeignKey("households.id"), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    start_utc = db.Column(db.DateTime(timezone=True), nullable=True)
    end_utc = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    tzid = db.Column(db.String(64), nullable=False) # e.g. "America/Los_Angeles"
    household = db.relationship('Household', backref=db.backref('events', lazy='dynamic'))

    def to_dict(self):
        def to_utc_z(dt):
            # If dt is naive (no tzinfo), assume it's already UTC, then mark it
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            # Normalize to UTC and emit Z-suffixed ISO
            return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")

        return {
            'id': self.id,
            'householdId': self.household_id,
            'title': self.title,
            'startUtc': to_utc_z(self.start_utc),
            'endUtc': to_utc_z(self.end_utc),
            'tzid': self.tzid,
            "createdAt": to_utc_z(self.created_at),
        }

    def __repr__(self):
        return f"Event {id}: {title}"