/**
 * CalendarEvent["hasTime"] is typed boolean but is a raw backend column that has arrived as the
 * strings "0"/"1". A strict `=== false` is always false for a string, which treated every event as
 * timed. Always check all-day-ness through here instead of comparing against `false`.
 */
export function isAllDayValue(hasTime: unknown): boolean {
    return hasTime === false || hasTime === "0" || hasTime === 0 || hasTime === "false";
}