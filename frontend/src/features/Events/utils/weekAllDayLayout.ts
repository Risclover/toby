import type { ComponentProps } from "react";
import type { Schedule } from "@mantine/schedule";
import dayjs from "dayjs";
import type { EventColorPayload } from "./getEventColors";

export type ScheduleEventData = NonNullable<ComponentProps<typeof Schedule>["events"]>[number];

export interface AllDayLaneItem {
    event: ScheduleEventData;
    lane: number;
    /** 0-6, day-of-week column this event's bar starts in, within the visible week */
    startCol: number;
    /** number of day columns this event's bar covers, clipped to the visible week */
    span: number;
}

const DAYS_IN_WEEK = 7;

/**
 * An event's day boundary is exclusive at exact midnight -- an event ending
 * "2026-09-17 00:00:00" occupies only the 16th, not the 17th. Subtracting a
 * millisecond before reading the calendar day is the same boundary nudge
 * getEventColors.ts/persistEventMove.ts use elsewhere for this exact reason;
 * kept independent here since this operates on already-expanded occurrences,
 * not the raw API payload.
 */
function lastOccupiedDay(end: string | Date) {
    return dayjs(end).subtract(1, "millisecond").startOf("day");
}

/**
 * True for anything that belongs in the all-day strip: real all-day events
 * (`hasTime: false`) and any event -- timed or not -- whose start and end
 * land on different calendar days. Mirrors what @mantine/schedule's own
 * WeekView docs describe as automatically routed to its (buggy) all-day
 * section, so filtering on this keeps our behavior consistent with what
 * the built-in one would have done, minus the overlap.
 */
export function isAllDayRowEvent(event: Pick<ScheduleEventData, "start" | "end" | "payload">): boolean {
    const payload = event.payload as EventColorPayload | undefined;
    if (payload?.hasTime === false) return true;
    return !dayjs(event.start).isSame(lastOccupiedDay(event.end), "day");
}

/**
 * Greedy interval/lane packing -- the same technique Google Calendar and
 * FullCalendar use for their all-day rows. Sort by start column, then by
 * span descending (so a wide multi-day bar claims its lane before the
 * narrower events squeezed in beside it), then place each event into the
 * first lane whose last occupant doesn't overlap it.
 *
 * This exists because @mantine/schedule's own all-day section has no such
 * packing: two all-day/multi-day events on the same day are simply
 * overlaid, which is the unreadable-text bug this file works around.
 * `events` should already be expanded/scoped to the visible week (see
 * useWeekAllDayEvents) -- this function only does layout, not date-range
 * filtering.
 */
export function packAllDayLanes(events: ScheduleEventData[], weekStart: dayjs.Dayjs): AllDayLaneItem[] {
    const weekEnd = weekStart.add(DAYS_IN_WEEK - 1, "day");

    const clipped = events
        .map((event) => {
            const start = dayjs(event.start);
            const end = lastOccupiedDay(event.end);
            const clippedStart = start.isBefore(weekStart, "day") ? weekStart : start;
            const clippedEnd = end.isAfter(weekEnd, "day") ? weekEnd : end;
            return {
                event,
                startCol: clippedStart.diff(weekStart, "day"),
                span: clippedEnd.diff(clippedStart, "day") + 1,
            };
        })
        .filter((item) => item.startCol >= 0 && item.startCol < DAYS_IN_WEEK && item.span > 0)
        .sort((a, b) => a.startCol - b.startCol || b.span - a.span);

    const laneLastCol: number[] = [];
    return clipped.map((item) => {
        let lane = laneLastCol.findIndex((lastCol) => lastCol < item.startCol);
        if (lane === -1) lane = laneLastCol.length;
        laneLastCol[lane] = item.startCol + item.span - 1;
        return { event: item.event, lane, startCol: item.startCol, span: item.span };
    });
}