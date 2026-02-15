// app/utils/formatAnnouncementTimestamp.ts
import { differenceInCalendarDays, format, parseISO, isSameYear } from "date-fns";
import { toZonedTime } from "date-fns-tz"; // CHANGED: utcToZonedTime -> toZonedTime

export function formatAnnouncementTimestamp(
    iso?: string | null,
    timeZone?: string
): { day: string; time: string } | "" {
    if (!iso) return "";

    const date = new Date(iso);
    if (isNaN(date.getTime())) return "";

    // If a timezone is provided, convert the UTC date to that timezone.
    // toZonedTime returns a Date object shifted so that it "looks" like the 
    // target time when printed/formatted as local time.
    const zonedDate = timeZone ? toZonedTime(date, timeZone) : date;

    // We also need "now" in that same timezone to compare days correctly
    // (e.g., it might be "Tomorrow" in Tokyo while "Today" in LA)
    const now = new Date();
    const zonedNow = timeZone ? toZonedTime(now, timeZone) : now;

    const diffDays = differenceInCalendarDays(zonedNow, zonedDate);

    let dayPart: string;

    if (diffDays === 0) dayPart = "Today";
    else if (diffDays === 1) dayPart = "Yesterday";
    else if (diffDays >= 2 && diffDays <= 6) dayPart = format(zonedDate, "EEE");
    else dayPart = isSameYear(zonedNow, zonedDate)
        ? format(zonedDate, "MMM d")
        : format(zonedDate, "MMM d, yyyy");

    const timePart = format(zonedDate, "h:mm a").toLowerCase();

    return { day: dayPart, time: timePart };
}
