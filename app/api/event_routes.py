from datetime import datetime, timedelta, timezone, date
from typing import Optional, Tuple
from flask import Blueprint, request, jsonify, abort
from sqlalchemy.orm import joinedload
from app.extensions import db
from app.models import Household, Event, EventAttendee, User
from zoneinfo import ZoneInfo
from app.utils.timezone import utc_datetime_to_local
from flask_login import current_user, login_required

try:
    from dateutil.rrule import rrulestr
except ImportError:  # pragma: no cover
    rrulestr = None

event_routes = Blueprint('events', __name__)


# -------------------- Helpers -------------------- #

def parse_iso8601(value: str) -> datetime:
    try:
        dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
        if dt.tzinfo is None:
            abort(400, description='start/end must be timezone-aware ISO strings')
        return dt
    except Exception:
        abort(400, description='Invalid ISO datetime format')


def compute_allday_utc_bounds(local_date: date, tzid: str) -> Tuple[datetime, datetime]:
    """Given a calendar date and a timezone, returns the (start_utc, end_utc)
    instants for midnight-to-midnight in that timezone -- i.e. the UTC bounds
    for an all-day event on that date. Shared by every place that creates or
    recomputes an all-day event's stored range, so the "local midnight, plus
    a day, converted to UTC" math only lives in one spot."""
    try:
        tz = ZoneInfo(tzid)
    except Exception:
        abort(400, description='Invalid tzid')
    local_start = datetime(local_date.year, local_date.month, local_date.day, 0, 0, 0, tzinfo=tz)
    local_end = local_start + timedelta(days=1)
    return local_start.astimezone(ZoneInfo("UTC")), local_end.astimezone(ZoneInfo("UTC"))


def get_event_or_404(hid: int, event_id: int) -> Event:
    """Looks up an event scoped to a household, 404ing if either the
    household or the event (within that household) doesn't exist. Shared by
    every route that operates on a single existing event."""
    Household.query.get_or_404(hid)
    return Event.query.filter_by(id=event_id, household_id=hid).first_or_404()


def require_creator_or_admin(event: Event, action: str):
    """Aborts with 403 unless the current user is the event's creator or the
    household admin. `action` is just for the error message, e.g. 'update'
    or 'delete'."""
    if current_user.id != event.creator_id and current_user.id != event.household.admin_id:
        abort(403, description=f"Only the creator and admin can {action} this event")


def validate_rrule(rrule_str: str) -> str:
    """Validate an RFC 5545 recurrence rule string. Returns it unchanged if
    valid, aborts with 400 otherwise."""
    if not rrule_str:
        return rrule_str
    if rrulestr is None:
        abort(500, description='python-dateutil is required to validate recurrence rules')
    try:
        # rrulestr needs a DTSTART to fully resolve -- today is fine, we're
        # only checking the rule itself parses, not computing real
        # occurrences here (the frontend does the actual expansion).
        dtstart = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
        rrulestr(f"DTSTART:{dtstart}\nRRULE:{rrule_str}")
    except Exception:
        abort(400, description='Invalid recurrence rule')
    return rrule_str


def get_household_member_ids(hid: int) -> set:
    """Returns the set of user ids belonging to this household.

    ASSUMPTION: User has a household_id FK. Replace this with your real
    membership lookup if that's not how membership works in your schema.
    """
    return {u.id for u in User.query.filter_by(household_id=hid).all()}


def resolve_attendee_ids(hid: int, requested_ids, fallback_id: Optional[int] = None) -> list:
    """Validates requested attendee ids belong to the household.

    An event must always have at least one attendee. `fallback_id` (the
    event's creator) is used ONLY when the submitted list is empty -- it is
    NOT unconditionally unioned in. That distinction matters: an earlier
    version force-included the creator on every call, which meant a creator
    who unassigned themselves via unassign_self would get silently re-added
    the next time anyone touched attendeeIds on that event. This version only
    kicks in the fallback when the list would otherwise be empty, so an
    explicit list that omits the creator (on update) is respected as-is.
    """
    member_ids = get_household_member_ids(hid)
    requested = set(requested_ids or [])

    invalid = requested - member_ids
    if invalid:
        abort(400, description=f'Attendee ids not in this household: {sorted(invalid)}')

    if not requested and fallback_id is not None:
        requested = {fallback_id}

    return list(requested)


def set_event_attendees(event: Event, attendee_ids: list):
    """Replaces an event's attendee list wholesale."""
    EventAttendee.query.filter_by(event_id=event.id).delete()
    for uid in attendee_ids:
        db.session.add(EventAttendee(event_id=event.id, user_id=uid))


def event_to_local_dict(event, user):
    """Convert event datetimes to user's local timezone for JSON response.

    All-day events (has_time=False) are date-anchored, not instant-anchored --
    they're rendered using the EVENT's own tzid, not the viewer's, so the
    displayed calendar date never shifts depending on who's looking at it.
    Timed events ARE converted to the viewer's local time, since those
    represent a real instant and viewer-local display is the correct/expected
    behavior.
    """
    d = event.to_dict()
    attendees = event.attendees  # computed once, reused below and not re-fetched by to_dict()

    if event.has_time:
        d["startUtc"] = utc_datetime_to_local(user, event.start_utc).isoformat() if event.start_utc else None
        d["endUtc"] = utc_datetime_to_local(user, event.end_utc).isoformat() if event.end_utc else None
    else:
        event_tz = ZoneInfo(event.tzid or "UTC")
        d["startUtc"] = event.start_utc.astimezone(event_tz).isoformat() if event.start_utc else None
        d["endUtc"] = event.end_utc.astimezone(event_tz).isoformat() if event.end_utc else None

    d["createdAt"] = utc_datetime_to_local(user, event.created_at).isoformat() if event.created_at else None

    # Display color rule: solo event -> attendee's color, multi-assignee
    # event -> household accent color.
    if len(attendees) == 1:
        d["displayColor"] = attendees[0].color
    else:
        d["displayColor"] = event.household.accent_color

    return d


# -------------------- Routes -------------------- #

@event_routes.get('/households/<int:hid>/events')
@login_required
def get_household_events(hid: int):
    Household.query.get_or_404(hid)

    start_s = request.args.get('start')
    end_s = request.args.get('end')
    fetch_all = request.args.get('all') == '1'
    attendee_ids = request.args.get('attendeeIds')

    q = Event.query.options(
        joinedload(Event.attendee_links).joinedload(EventAttendee.user)
    ).filter(Event.household_id == hid)

    if fetch_all:
        q = q.filter(Event.start_utc.isnot(None), Event.end_utc.isnot(None))
    else:
        if not start_s or not end_s:
            abort(400, description='start and end query params are required (or pass all=1)')
        start = parse_iso8601(start_s)
        end = parse_iso8601(end_s)
        if start >= end:
            abort(400, description='start must be before end')

        q = q.filter(
            Event.start_utc < end,
            Event.end_utc > start,
        )

    if attendee_ids:
        try:
            requested_ids = {int(x) for x in attendee_ids.split(',') if x.strip()}
        except ValueError:
            abort(400, description='attendeeIds must be a comma-separated list of integers')
        q = q.join(Event.attendee_links).filter(EventAttendee.user_id.in_(requested_ids))

    events = q.order_by(Event.start_utc.asc()).all()
    return jsonify([event_to_local_dict(e, current_user) for e in events]), 200


@event_routes.post('/households/<int:hid>/events')
@login_required
def create_event_for_household(hid: int):
    Household.query.get_or_404(hid)
    data = request.get_json(silent=True) or {}

    title = (data.get('title') or '').strip()
    start_s = data.get('startUtc')
    end_s = data.get('endUtc')
    date_s = data.get('date')
    tzid = data.get('tzid') or 'UTC'
    rrule = validate_rrule(data.get('rrule'))
    requested_attendee_ids = data.get('attendeeIds') or []

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
        start, end = compute_allday_utc_bounds(d, tzid)
        has_time = False

    else:
        abort(400, description='Event must have a date (pass "date" for an all-day event, or both "startUtc" and "endUtc" for a timed one)')

    ev = Event(
        household_id=hid,
        creator_id=current_user.id,
        title=title,
        start_utc=start,
        end_utc=end,
        tzid=tzid,
        has_time=has_time,
        rrule=rrule,
    )
    db.session.add(ev)
    db.session.flush()  # need ev.id before attaching attendees

    attendee_ids = resolve_attendee_ids(hid, requested_attendee_ids, fallback_id=current_user.id)
    set_event_attendees(ev, attendee_ids)

    db.session.commit()
    return jsonify(event_to_local_dict(ev, current_user)), 201


@event_routes.route("/households/<int:hid>/events/<int:event_id>", methods=["DELETE"])
@login_required
def delete_event(hid: int, event_id: int):
    ev = get_event_or_404(hid, event_id)
    require_creator_or_admin(ev, "delete")

    db.session.delete(ev)  # cascades to event_attendees
    db.session.commit()
    return ("", 204)


@event_routes.route("/households/<int:hid>/events/<int:event_id>", methods=["PATCH", "PUT"])
@login_required
def update_event(hid: int, event_id: int):
    event = get_event_or_404(hid, event_id)
    require_creator_or_admin(event, "update")
    data = request.get_json(silent=True) or {}

    if "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            abort(400, description="Title cannot be empty")
        event.title = title

    if "rrule" in data:
        event.rrule = validate_rrule(data.get("rrule"))

    if "attendeeIds" in data:
        # fallback_id is the EVENT's creator, not current_user -- an admin
        # editing someone else's event should still fall back to the actual
        # creator, not themselves, if the submitted list is empty.
        attendee_ids = resolve_attendee_ids(hid, data.get("attendeeIds") or [], fallback_id=event.creator_id)
        set_event_attendees(event, attendee_ids)

    tzid_in = data.get('tzid')
    schedule_keys = {'startUtc', 'endUtc', 'date'}
    touched_schedule = any(key in data for key in schedule_keys)

    if touched_schedule:
        # Case A: timed (startUtc/endUtc) present -> both required
        if ('startUtc' in data) or ('endUtc' in data):
            start_s = data.get('startUtc')
            end_s = data.get('endUtc')

            if not (start_s and end_s):
                abort(400, description='Provide both startUtc and endUtc, or neither.')

            start = parse_iso8601(start_s)
            end = parse_iso8601(end_s)

            if start >= end:
                abort(400, description='startUtc must be before endUtc')

            event.start_utc = start
            event.end_utc = end
            event.has_time = True

            if tzid_in:
                try:
                    ZoneInfo(tzid_in)
                except Exception:
                    abort(400, description='Invalid tzid')
                event.tzid = tzid_in

        # Case B: all-day (date) present -> recompute day bounds
        elif 'date' in data:
            date_s = data.get('date')
            try:
                d = datetime.strptime(date_s, "%Y-%m-%d").date()
            except Exception:
                abort(400, description='date must be YYYY-MM-DD')

            tzid_use = tzid_in or event.tzid or 'UTC'
            event.start_utc, event.end_utc = compute_allday_utc_bounds(d, tzid_use)
            event.has_time = False
            event.tzid = tzid_use

    else:
        # No explicit schedule change, but tzid might still be provided
        if tzid_in:
            try:
                ZoneInfo(tzid_in)
            except Exception:
                abort(400, description='Invalid tzid')

            if event.has_time:
                # Timed events: change tz metadata only; keep UTC instants
                event.tzid = tzid_in
            else:
                old_tz = ZoneInfo(event.tzid or 'UTC')
                local_date = event.start_utc.astimezone(old_tz).date()
                event.start_utc, event.end_utc = compute_allday_utc_bounds(local_date, tzid_in)
                event.tzid = tzid_in
                event.has_time = False

    db.session.commit()
    return jsonify(event_to_local_dict(event, current_user)), 200


@event_routes.post("/households/<int:hid>/events/<int:event_id>/unassign")
@login_required
def unassign_self(hid: int, event_id: int):
    """Any current attendee can remove themselves from an event -- this is
    intentionally NOT gated behind the creator/admin check used everywhere
    else. Note: the creator can also unassign themselves this way. They keep
    their edit/delete rights via creator_id regardless -- attendee
    membership and creator/admin permissions are independent by design."""
    event = get_event_or_404(hid, event_id)

    link = EventAttendee.query.filter_by(event_id=event.id, user_id=current_user.id).first()
    if link is None:
        abort(400, description="You are not assigned to this event")

    # An event must always have at least one attendee -- if you're the last
    # one, block the unassign rather than silently re-adding you back (which
    # would just be a confusing no-op with no explanation).
    remaining_count = EventAttendee.query.filter_by(event_id=event.id).count()
    if remaining_count <= 1:
        abort(400, description="Can't unassign -- at least one person must remain assigned to this event")

    db.session.delete(link)
    db.session.commit()
    return jsonify(event_to_local_dict(event, current_user)), 200