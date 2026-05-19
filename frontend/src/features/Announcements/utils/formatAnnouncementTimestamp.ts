// app/utils/formatAnnouncementTimestamp.ts
import { differenceInCalendarDays, format, isSameYear } from "date-fns";
import { toZonedTime } from "date-fns-tz";

function sanitizeTimezone(tz?: string): string | undefined {
    if (!tz) return undefined;
    const cleaned = tz.trim().replace(" ", "_");
    try {
        Intl.DateTimeFormat(undefined, { timeZone: cleaned });
        return cleaned;
    } catch {
        return undefined;
    }
}

export function formatAnnouncementTimestamp(
    iso?: string | null,
    timeZone?: string
): { day: string; time: string } | "" {
    if (!iso) return "";
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "";

    const safeZone = sanitizeTimezone(timeZone);
    const zonedDate = safeZone ? toZonedTime(date, safeZone) : date;
    const now = new Date();
    const zonedNow = safeZone ? toZonedTime(now, safeZone) : now;

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