# app/utils/timezone.py
from datetime import datetime, date, time
import pytz

def get_user_timezone(user):
    """
    Returns the pytz timezone object for a given user.
    Defaults to UTC if not set.
    """
    tz_str = getattr(user, "timezone", "UTC")
    return pytz.timezone(tz_str)


def local_date_to_utc_datetime(user, local_date, at_time=None):
    """
    Convert a date in the user's local timezone to a UTC datetime.

    :param user: User object with 'timezone' attribute
    :param local_date: datetime.date object (e.g. due date)
    :param at_time: datetime.time object, defaults to midnight
    :return: datetime in UTC
    """
    if at_time is None:
        at_time = time.min  # 00:00

    user_tz = get_user_timezone(user)
    local_dt = datetime.combine(local_date, at_time)
    local_dt = user_tz.localize(local_dt)
    return local_dt.astimezone(pytz.UTC)


def utc_datetime_to_local(user, utc_dt):
    """
    Convert a UTC datetime to the user's local timezone.
    Returns a NAIVE datetime (tzinfo=None) so the frontend displays 
    the exact clock time regardless of the browser's location.
    """
    if utc_dt is None:
        return None

    if utc_dt.tzinfo is None:
        from datetime import timezone
        utc_dt = utc_dt.replace(tzinfo=timezone.utc)

    user_tz = get_user_timezone(user)
    
    # 1. Convert to the user's specific timezone
    localized_dt = utc_dt.astimezone(user_tz)
    
    # 2. STRIP the timezone info. 
    # This prevents the browser from converting it back to the device's local time.
    return localized_dt.replace(tzinfo=None)


def now_utc():
    """
    Returns current UTC time.
    """
    return datetime.utcnow().replace(tzinfo=pytz.UTC)