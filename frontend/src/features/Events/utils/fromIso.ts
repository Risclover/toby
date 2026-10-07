import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Formats an ISO instant as a local "YYYY-MM-DD" date. Pass the event's own
 * tzid for an all-day event's startUtc/endUtc -- toAllDayBoundary anchors
 * an all-day boundary to the EVENT's tzid (not the browser's current one),
 * so reading it back must use that same zone, or a browser/event tzid
 * mismatch silently shifts the seeded date by a day. Omit tzid for timed
 * events, where showing the browser's own current local time is correct
 * (matches how toEventStart passes timed events straight through).
 */
export const ymdFromIso = (iso?: string | null, tzid?: string, fallback = new Date()) => {
    const value = dayjs(iso ?? fallback);
    return (tzid ? value.tz(tzid) : value).format("YYYY-MM-DD");
};

export const hmFromIso = (iso?: string | null) =>
    iso ? dayjs(iso).format("HH:mm") : "";