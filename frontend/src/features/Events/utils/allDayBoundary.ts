import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

/** Local midnight of `civilDate` in `tzid`, as a UTC ISO instant. */
export function toAllDayStartUtc(civilDate: string, tzid: string): string {
    return dayjs.tz(civilDate, tzid).startOf("day").toISOString();
}

/**
 * Exclusive end boundary for an all-day range: local midnight of the day
 * AFTER `civilDateInclusive`, in `tzid`, as a UTC ISO instant.
 */
export function toAllDayEndUtc(civilDateInclusive: string, tzid: string): string {
    return toAllDayStartUtc(dayjs(civilDateInclusive).add(1, "day").format("YYYY-MM-DD"), tzid);
}