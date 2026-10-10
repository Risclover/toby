import dayjs from "dayjs";

import { DATE_FORMAT, EVENT_ID_SEPARATOR } from "./calendarConstants";
import type { ScheduleEventData } from "./calendarTypes";
import { splitEventIntoDaySegments } from "./dayViewEvents";
import type { EventColorPayload } from "./eventColorPayload";
import { toRangeEvents } from "./recurrenceExpansion";

/**
 * Feeds MobileMonthView's below-grid list for the selected day. Recurring events are pre-expanded
 * (Mantine's own expansion has the DST bug) and multi-day events are split into per-day entries
 * (Mantine buckets an event under its start day only). Then one `::dot` entry is fanned out per
 * attendee color; isDotSibling entries are hidden from the list, so each event still shows as one row.
 */
export function toMobileMonthEvents(
    scheduleEvents: ScheduleEventData[],
    rangeStart: string,
    rangeEnd: string
): ScheduleEventData[] {
    const expandedEvents = toRangeEvents(scheduleEvents, rangeStart, rangeEnd);

    const daySplitEvents = expandedEvents.flatMap((event) =>
        splitEventIntoDaySegments(event, event.payload as EventColorPayload | undefined)
    );

    return daySplitEvents.flatMap((event) => {
        const payload = event.payload as EventColorPayload | undefined;
        const colors = payload?.colors ?? [event.color as string];

        if (colors.length <= 1) {
            return [event];
        }

        return colors.map((color, i) => ({
            ...event,
            id: `${event.id}${EVENT_ID_SEPARATOR}dot${i}`,
            color,
            payload: { ...payload, isDotSibling: i > 0 },
        } as ScheduleEventData));
    });
}

/**
 * For each date in [rangeStart, rangeEnd], the distinct attendee colors with at least one event that
 * day, which the mobile month grid's day-cell indicator is drawn from. Mantine's built-in indicators
 * are one dot per event, so three same-person events drew three identical dots. Grouping by day and
 * deduplicating by color fixes that. Multi-day events mark every day they span.
 */
export function toMobileMonthDayDots(
    scheduleEvents: ScheduleEventData[],
    rangeStart: string,
    rangeEnd: string
): Record<string, string[]> {
    const dayColors = new Map<string, Set<string>>();
    const expandedEvents = toRangeEvents(scheduleEvents, rangeStart, rangeEnd);

    for (const event of expandedEvents) {
        const payload = event.payload as EventColorPayload | undefined;
        const colors = payload?.colors ?? [event.color as string];

        const firstDay = dayjs(event.start).startOf("day");
        const lastDay = dayjs(event.end).startOf("day");
        const dayCount = Math.max(lastDay.diff(firstDay, "day"), 0);

        for (let i = 0; i <= dayCount; i++) {
            const day = firstDay.add(i, "day").format(DATE_FORMAT);
            if (!dayColors.has(day)) dayColors.set(day, new Set());
            const daySet = dayColors.get(day)!;
            for (const color of colors) daySet.add(color);
        }
    }

    const result: Record<string, string[]> = {};
    for (const [day, colors] of dayColors) {
        result[day] = Array.from(colors);
    }
    return result;
}