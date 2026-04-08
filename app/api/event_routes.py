from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, abort
from sqlalchemy import and_
from app.extensions import db
from app.models import Household, Event
from zoneinfo import ZoneInfo
from app.utils.timezone import utc_datetime_to_local
from flask_login import current_user, login_required

event_routes = Blueprint('events', __name__)

# Helpers
def parse_iso8601(value: str) -> datetime:
    try:
        dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
        if dt.tzinfo is None:
            abort(400, description='start/end must be timezone-aware ISO strings')
        return dt
    except Exception:
        abort(400, description='Invalid ISO datetime format')


def event_to_local_dict(event, user):
    """
    Convert event datetimes to user's local timezone for JSON response.
    """
    d = event.to_dict()
    d["startUtc"] = utc_datetime_to_local(user, event.start_utc).isoformat() if event.start_utc else None
    d["endUtc"]   = utc_datetime_to_local(user, event.end_utc).isoformat() if event.end_utc else None
    d["createdAt"] = utc_datetime_to_local(user, event.created_at).isoformat() if event.created_at else None
    return d


# -------------------- Routes -------------------- #

@event_routes.get('/households/<int:hid>/events')
def get_household_events(hid: int):
    Household.query.get_or_404(hid)

    start_s    = request.args.get('start')
    end_s      = request.args.get('end')
    fetch_all  = request.args.get('all') == '1'

    q = Event.query.filter(Event.household_id == hid)

    if fetch_all:
        q = q.filter(Event.start_utc.isnot(None), Event.end_utc.isnot(None))
    else:
        if not start_s or not end_s:
            abort(400, description='start and end query params are required (or pass all=1)')
        start = parse_iso8601(start_s)
        end   = parse_iso8601(end_s)
        if start >= end:
            abort(400, description='start must be before end')

        q = q.filter(
            Event.start_utc < end,
            Event.end_utc > start,
        )

    events = q.order_by(Event.start_utc.asc()).all()
    return jsonify([event_to_local_dict(e, current_user) for e in events]), 200


@event_routes.post('/households/<int:hid>/events')
def create_event_for_household(hid: int):
    household = Household.query.get_or_404(hid)
    data = request.get_json(silent=True) or {}

    title = (data.get('title') or '').strip()
    start_s = data.get('startUtc')
    end_s   = data.get('endUtc')
    date_s  = data.get('date')
    tzid    = data.get('tzid') or 'UTC'

    if not title:
        abort(400, description='Title is required')

    start = end = None
    has_time = False

    if start_s or end_s:
        if not (start_s and end_s):
            abort(400, description='Provide both startUtc and endUtc, or neither.')
        start = parse_iso8601(start_s)
        end = parse_iso8601(end_s)
        if start >= end:
            abort(400, description='startUtc must be before endUtc')
        has_time = True

    elif date_s:
        try:
            d = datetime.strptime(date_s, "%Y-%m-%d").date()
        except ValueError:
            abort(400, description='date must be YYYY-MM-DD')
        try:
            tz = ZoneInfo(tzid)
        except Exception:
            abort(400, description='Invalid tzid')

        local_start = datetime(d.year, d.month, d.day, 0, 0, 0, tzinfo=tz)
        local_end   = local_start + timedelta(days=1)
        start = local_start.astimezone(ZoneInfo("UTC"))
        end   = local_end.astimezone(ZoneInfo("UTC"))
        has_time = False

    ev = Event(
        household_id=hid,
        creator_id=current_user.id, 
        title=title,
        start_utc=start,
        end_utc=end,
        tzid=tzid,
        has_time=has_time,
    )
    db.session.add(ev)
    db.session.commit()
    return jsonify(event_to_local_dict(ev, current_user)), 201


@event_routes.route("/households/<int:hid>/events/<int:event_id>", methods=["DELETE"])
def delete_event(hid: int, event_id: int):
    Household.query.get_or_404(hid)
    ev = Event.query.filter_by(id=event_id, household_id=hid).first_or_404()
    db.session.delete(ev)
    db.session.commit()
    return ("", 204)


@event_routes.route("/households/<int:hid>/events/<int:event_id>", methods=["PATCH", "PUT"])
def update_event(hid: int, event_id: int):
    Household.query.get_or_404(hid)
    event = Event.query.filter_by(id=event_id, household_id=hid).first_or_404()
    data = request.get_json(silent=True) or {}

    if current_user.id != event.creator_id and current_user.id != event.household.admin_id:
        abort(403, description="Only the creator and admin can update this event")

    if "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            abort(400, description="Title cannot be empty")
        event.title = title

    tzid_in = data.get('tzid')
    schedule_keys = {'startUtc', 'endUtc', 'date'}
    touched_schedule = any(key in data for key in schedule_keys)

    if touched_schedule:
        # Case A: timed (startUtc/endUtc) present -> both required
        if ('startUtc' in data) or ('endUtc' in data):
            start_s = data.get('startUtc')
            end_s   = data.get('endUtc')

            if not (start_s and end_s):
                abort(400, description='Provide both startUtc and endUtc, or neither.')

            start = parse_iso8601(start_s)
            end   = parse_iso8601(end_s)

            if start >= end:
                abort(400, description='startUtc must be before endUtc')

            event.start_utc = start
            event.end_utc   = end
            event.has_time  = True

            if tzid_in:
                try:
                    ZoneInfo(tzid_in)
                except Exception:
                    abort(400, description='Invalid tzid')
                event.tzid = tzid_in

        # Case B: all-day (date) present → recompute day bounds
        elif 'date' in data:
            date_s = data.get('date')
            try:
                d = datetime.strptime(date_s, "%Y-%m-%d").date()
            except Exception:
                abort(400, description='date must be YYYY-MM-DD')

            tzid_use = tzid_in or event.tzid or 'UTC'
            try:
                tz = ZoneInfo(tzid_use)
            except Exception:
                abort(400, description='Invalid tzid')

            local_start = datetime(d.year, d.month, d.day, 0, 0, 0, tzinfo=tz)
            local_end   = local_start + timedelta(days=1)
            event.start_utc = local_start.astimezone(ZoneInfo("UTC"))
            event.end_utc   = local_end.astimezone(ZoneInfo("UTC"))
            event.has_time  = False
            event.tzid      = tzid_use

    else:
        # No explicit schedule change, but tzid might still be provided
        if tzid_in:
            try:
                new_tz = ZoneInfo(tzid_in)
            except Exception:
                abort(400, description='Invalid tzid')

            if event.has_time:
                # Timed events: change tz metadata only; keep UTC instants
                event.tzid = tzid_in
            else:
                old_tz = ZoneInfo(event.tzid or 'UTC')
                local_start_old = event.start_utc.astimezone(old_tz)
                local_date = local_start_old.date()

                new_local_start = datetime(
                    local_date.year, local_date.month, local_date.day, 0, 0, 0, tzinfo=new_tz
                )
                new_local_end = new_local_start + timedelta(days=1)

                event.start_utc = new_local_start.astimezone(ZoneInfo("UTC"))
                event.end_utc   = new_local_end.astimezone(ZoneInfo("UTC"))
                event.tzid      = tzid_in
                event.has_time  = False

    db.session.commit()
    return jsonify(event_to_local_dict(event, current_user)), 200