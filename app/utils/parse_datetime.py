from datetime import datetime
from dateutil.parser import parse as dateutil_parse

def parse_datetime(dt_str):
    if not dt_str:
        return None
    try:
        dt = dateutil_parse(dt_str)
        if dt.tzinfo is None:
            from pytz import UTC
            dt = dt.replace(tzinfo=UTC)
        return dt
    except (ValueError, TypeError):
        return None
