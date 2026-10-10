import dayjs from "dayjs";
import { RRule, RRuleSet } from "rrule";

import "./dayjsPlugins";
import { DATE_FORMAT, DEFAULT_TZID, EVENT_ID_SEPARATOR, WALL_CLOCK_FORMAT } from "./calendarConstants";
import type { ScheduleEventData } from "./calendarTypes";
import type { EventColorPayload } from "./eventColorPayload";

const MS_PER_DAY = 86_400_000;

/**
 * Builds a Date whose UTC fields equal the wall-clock string's fields. rrule.js does its calendar
 * math on a Date's UTC getters, so building dates this way, and reading results back with dayjs.utc,
 * keeps every step in a DST-proof space. A locally-parsed Date drifts by the UTC offset, which itself
 * changes across a DST transition, and corrupts an occurrence's date by up to a day.
 */
function wallClockToRRuleDate(value: string): Date {
    const [datePart, timePart = "00:00:00"] = value.split(" ");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute, second] = timePart.split(":").map(Number);
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second || 0));
}

/**
 * Expands ONE recurring event into concrete, non-recurring occurrences overlapping
 * [rangeStart, rangeEnd] (inclusive "YYYY-MM-DD"). A non-recurring event passes through unchanged.
 * Shared by every view so none of them (nor Mantine, which has the same DST bug) computes an
 * occurrence date itself.
 */
export function expandRecurringOccurrencesInRange(
    event: ScheduleEventData,
    rangeStart: string,
    rangeEnd: string
): ScheduleEventData[] {
    const recurrence = event.recurrence as { rrule: string; exdate: string[] } | undefined;
    if (!recurrence?.rrule) return [event];

    const payload = event.payload as EventColorPayload | undefined;
    const isAllDay = payload?.hasTime === false;
    const tzid = payload?.tzid ?? DEFAULT_TZID;

    // An all-day event's start/end are already naive wall-clock strings; a timed one is a real UTC
    // instant. Convert it to the event's OWN tzid (not the viewer's) so it keeps the same local time across DST.
    const toMasterWallClock = (value: string): string =>
        isAllDay ? value : dayjs(value).tz(tzid).format(WALL_CLOCK_FORMAT);

    const dtstart = wallClockToRRuleDate(toMasterWallClock(event.start as string));
    const durationMs = wallClockToRRuleDate(toMasterWallClock(event.end as string)).getTime() - dtstart.getTime();

    let rule: RRule;
    try {
        rule = new RRule({ ...RRule.parseString(recurrence.rrule), dtstart });
    } catch {
        return [];
    }

    const set = new RRuleSet();
    set.rrule(rule);
    // exdate entries are written by us as wall-clock-in-tzid strings, the same space dtstart lives in.
    (recurrence.exdate ?? []).forEach((ex) => {
        try { set.exdate(wallClockToRRuleDate(ex)); } catch { /* ignore a bad exdate entry */ }
    });

    // Pad the window back by the event's duration so a multi-day occurrence that started before rangeStart isn't missed.
    const durationDays = Math.max(Math.ceil(durationMs / MS_PER_DAY), 1);
    const windowStart = wallClockToRRuleDate(dayjs(rangeStart).subtract(durationDays, "day").format(`${DATE_FORMAT} 00:00:00`));
    const windowEnd = wallClockToRRuleDate(dayjs(rangeEnd).format(`${DATE_FORMAT} 23:59:59`));

    return set.between(windowStart, windowEnd, true).map((occStart) => {
        const occEnd = new Date(occStart.getTime() + durationMs);
        // occStart/occEnd's UTC fields ARE the wall-clock-in-tzid date/time rrule computed.
        const occStartWallClock = dayjs.utc(occStart).format(WALL_CLOCK_FORMAT);
        const occEndWallClock = dayjs.utc(occEnd).format(WALL_CLOCK_FORMAT);

        // All-day keeps the naive string; a timed occurrence goes back to a real UTC instant like every other timed event.
        const occStartOut = isAllDay ? occStartWallClock : dayjs.tz(occStartWallClock, tzid).toISOString();
        const occEndOut = isAllDay ? occEndWallClock : dayjs.tz(occEndWallClock, tzid).toISOString();

        return {
            ...event,
            id: `${event.id}${EVENT_ID_SEPARATOR}occ${occStart.getTime()}`,
            start: occStartOut,
            end: occEndOut,
            recurrence: undefined,
            // persistEventMove decides exclude-and-recreate vs plain update from recurringInstance, metadata
            // Mantine used to attach when it expanded occurrences itself. Rebuilt here; without it a drag
            // falls through to updateEvent with a NaN id. recurrenceId is always the wall-clock-in-tzid form
            // (even for timed events), because Flask appends it verbatim to exdate and the exdate parser above expects it.
            recurringInstance: {
                isRecurringInstance: true,
                recurringEventId: event.id,
                recurrenceId: occStartWallClock,
            },
        } as unknown as ScheduleEventData;
    });
}

/** Pre-expands every recurring event so Week/Month/Agenda never hand Mantine a `recurrence` field. */
export function toRangeEvents(
    events: ScheduleEventData[],
    rangeStart: string,
    rangeEnd: string
): ScheduleEventData[] {
    return events.flatMap((event) => expandRecurringOccurrencesInRange(event, rangeStart, rangeEnd));
}