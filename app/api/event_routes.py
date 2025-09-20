from datetime import datetime
from flask import Blueprint, request, jsonify, abort
from sqlalchemy import and_
from app.extensions import db
from app.models import Household, Event
from datetime import datetime

event_routes = Blueprint('events', __name__)

# Helpers
def parse_iso8601(value: str) -> datetime:
    try:
        # Accepts '...Z' or offset; ensures aware datetime
        dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
        if dt.tzinfo is None:
            abort(400, description='start/end must be timezone-aware ISO strings')
        return dt
    except Exception:
        abort(400, description='Invalid ISO datetime format')


@event_routes.get('/households/<int:hid>/events')
def get_events_for_household(hid: int):
    # Validate household exists (optional but helpful)
    Household.query.get_or_404(hid)

    start_s = request.args.get('start')
    end_s = request.args.get('end')
    if not start_s or not end_s:
        abort(400, description='start and end query params are required')

    start = parse_iso8601(start_s)
    end = parse_iso8601(end_s)
    if start >= end:
        abort(400, description='start must be before end')

    # overlap: start < end AND end > start
    q = (
        Event.query
        .filter(Event.household_id == hid)
        .filter(and_(Event.start_utc < end, Event.end_utc > start))
        .order_by(Event.start_utc.asc())
    )

    return jsonify([e.to_dict() for e in q.all()])


@event_routes.post('/households/<int:hid>/events')
def create_event_for_household(hid: int):
    household = Household.query.get(hid)
    data = request.get_json(silent=True) or {}

    title = (data.get('title') or '').strip()
    start_s = data.get('startUtc')
    end_s = data.get('endUtc')
    tzid = data.get('tzid') or 'UTC'

    if not title:
        abort(400, description='Title is required')
    if not start_s or not end_s:
        abort(400, description='startUtc and endUtc are required')

    start = parse_iso8601(start_s)
    end = parse_iso8601(end_s)
    if start >= end:
        abort(400, description='startUtc must be before endUtc')

    ev = Event(
        household_id=hid,
        title=title,
        start_utc=start,
        end_utc=end,
        tzid=tzid,
    )
    db.session.add(ev)
    db.session.commit()

    return jsonify(ev.to_dict()), 201
