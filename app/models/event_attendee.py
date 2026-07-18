from app.extensions import db

class EventAttendee(db.Model):
    """
    Join table: who is assigned to a given event. An event can have many
    attendees, and a user can be attached to many events.
    """
 
    __tablename__ = "event_attendees"
 
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(
        db.Integer, db.ForeignKey("events.id", ondelete="CASCADE"), nullable=False
    )
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
 
    user = db.relationship("User")
 
    __table_args__ = (
        db.UniqueConstraint("event_id", "user_id", name="uq_event_attendee"),
    )
 