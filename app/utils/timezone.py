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
    
    :param user: User object with 'timezone' attribute
    :param utc_dt: datetime in UTC
    :return: datetime in user's local timezone
    """
    if utc_dt is None:
        return None
    user_tz = get_user_timezone(user)
    return utc_dt.astimezone(user_tz)


def now_utc():
    """
    Returns current UTC time.
    """
    return datetime.utcnow().replace(tzinfo=pytz.UTC)