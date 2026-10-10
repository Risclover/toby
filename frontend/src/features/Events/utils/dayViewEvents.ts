import dayjs, { type Dayjs } from "dayjs";

import { EVENT_ID_SEPARATOR, WALL_CLOCK_FORMAT } from "./calendarConstants";
import type { ScheduleEventData } from "./calendarTypes";
import type { EventColorPayload } from "./eventColorPayload";
import { expandRecurringOccurrencesInRange } from "./recurrenceExpansion";

/**
 * Splits ONE event that spans multiple days into one Day view segment per day. Shared by the plain
 * multi-day path and the recurring path so the two can't drift apart.
 */
export function splitEventIntoDaySegments(
    event: ScheduleEventData,
    payload: EventColorPayload | undefined
): ScheduleEventData[] {
    const start = dayjs(event.start);
    const end = dayjs(event.end);
    const firstDay = start.startOf("day");
    const lastDay = end.startOf("day");
    const dayCount = lastDay.diff(firstDay, "day");

    if (dayCount <= 0) return [event];

    const dayBoundaryEnd = (day: Dayjs) =>
        day.add(1, "day").subtract(1, "second").format(WALL_CLOCK_FORMAT);

    // Stashed on every segment so EventDetailsModal can show the event's true full span.
    const originalSpan = {
        originalStart: event.start as string,
        originalEnd: event.end as string,
    };

    if (payload?.hasTime === false) {
        // Day view shows one day at a time and only finds a multi-day all-day event on its start day,
        // so emit one whole-day entry (00:00-23:59, like a single-day all-day event) per spanned day.
        return Array.from({ length: dayCount + 1 }, (_, i) => {
            const day = firstDay.add(i, "day");
            return {
                ...event,
                id: i === 0 ? event.id : `${event.id}${EVENT_ID_SEPARATOR}allDayContinuation${i}`,
                start: day.format(WALL_CLOCK_FORMAT),
                end: dayBoundaryEnd(day),
                payload: { ...payload, ...originalSpan, ...(i > 0 ? { isDayViewContinuation: true } : {}) },
            } as ScheduleEventData;
        });
    }

    const segments: ScheduleEventData[] = [{
        ...event,
        end: dayBoundaryEnd(firstDay),
        payload: { ...payload, ...originalSpan },
    } as ScheduleEventData];

    for (let i = 1; i <= dayCount; i++) {
        const day = firstDay.add(i, "day");
        const isFinalDay = i === dayCount;
        segments.push({
            ...event,
            id: `${event.id}${EVENT_ID_SEPARATOR}continuation${i}`,
            start: day.format(WALL_CLOCK_FORMAT),
            end: isFinalDay ? end.format(WALL_CLOCK_FORMAT) : dayBoundaryEnd(day),
            payload: { ...payload, ...originalSpan, isDayViewContinuation: true },
        } as ScheduleEventData);
    }
    return segments;
}

/** Expands a recurring event, keeps only the occurrences overlapping the visible day, and day-splits each. */
function expandRecurringOccurrencesForDay(event: ScheduleEventData, visibleDate: string): ScheduleEventData[] {
    const payload = event.payload as EventColorPayload | undefined;
    const day = dayjs(visibleDate);
    const dayStart = day.startOf("day");
    const dayEnd = day.endOf("day");

    return expandRecurringOccurrencesInRange(event, visibleDate, visibleDate).flatMap((occurrenceEvent) => {
        const occStartLocal = dayjs(occurrenceEvent.start as string);
        const occEndLocal = dayjs(occurrenceEvent.end as string);
        const overlapsVisibleDay = !occEndLocal.isBefore(dayStart) && !occStartLocal.isAfter(dayEnd);
        if (!overlapsVisibleDay) return [];

        return splitEventIntoDaySegments(occurrenceEvent, payload);
    });
}

export function toDayViewEvents(events: ScheduleEventData[], visibleDate: string): ScheduleEventData[] {
    return events.flatMap((event) => {
        if (event.recurrence) return expandRecurringOccurrencesForDay(event, visibleDate);
        return splitEventIntoDaySegments(event, event.payload as EventColorPayload | undefined);
    });
}