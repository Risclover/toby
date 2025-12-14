import { differenceInCalendarDays, format, parseISO, isSameYear } from "date-fns";

export function formatAnnouncementTimestamp(iso?: string | null): { day: string; time: string } | "" {
    if (!iso) return "";

    const date = parseISO(iso);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    console.log('now:', now);
    console.log('date:', date);
    // How many whole calendar days between "now" and "date"
    const diffDays = differenceInCalendarDays(
        now, date
    );

    let dayPart: string;

    if (diffDays === 0) {
        // Today
        dayPart = "Today";
    } else if (diffDays === 1) {
        // Yesterday
        dayPart = "Yesterday";
    } else if (diffDays >= 2 && diffDays <= 6) {
        // Mon, Tue, Wed...
        dayPart = format(date, "EEE"); // short weekday
    } else {
        // Older 
        if (isSameYear(now, date)) {
            // Mar 20 
            dayPart = format(date, "MMM d");
        } else {
            // Mar 20, 2024 
            dayPart = format(date, "MMM d, yyyy");
        }
    }

    // Time part: "8:04 pm"
    const timePart = format(date, "h:mm a").toLowerCase();

    return { day: dayPart, time: timePart };

}