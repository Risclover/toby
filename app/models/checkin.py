# app/models/checkin.py
from app.extensions import db
from sqlalchemy import UniqueConstraint, func

def _iso_utc(dt):
    if dt is None:
        return None
    # Normalize to UTC, drop microseconds, add 'Z' suffix
    return dt.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

class Checkin(db.Model):
    __tablename__ = "checkins"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    local_date = db.Column(db.Date, nullable=False)  # day in user's tz at check-in
    created_at_utc = db.Column(db.DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "local_date", name="uq_checkins_user_localdate"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "localDate": self.local_date.isoformat() if self.local_date else None,  # e.g., "2025-09-20"
            "createdAtUtc": _iso_utc(self.created_at_utc), # e.g., "2025-09-20T08:15:00Z"
        }