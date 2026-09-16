import type { ComponentProps } from "react";
import type { Schedule } from "@mantine/schedule";
import type { CalendarEvent } from "@/store";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

type ScheduleEventData = NonNullable<ComponentProps<typeof Schedule>["events"]>[number];

export type HouseholdMemberColor = { id: number; color: string };

export type EventColorPayload = {
    colors: string[];
    hasTime: boolean;
    visibility: string;
    allMembers: boolean;
    attendeeIds: number[];
    [key: string]: unknown;
};

export function getEventColors(
    event: Pick<CalendarEvent, "color" | "attendeeIds" | "allMembers">,
    members: HouseholdMemberColor[]
): string[] {
    const assignedIds = event.allMembers ? members.map((m) => m.id) : event.attendeeIds ?? [];
    if (assignedIds.length === 0) {
        return [event.color ?? "blue"];
    }
    const colorById = new Map(members.map((m) => [m.id, m.color]));
    const colors = assignedIds.map((id) => colorById.get(id)).filter((c): c is string => Boolean(c));
    return colors.length > 0 ? colors : [event.color ?? "blue"];
}

/**
 * All-day events have no instant -- "Sep 27" means Sep 27, independent of
 * the viewer's timezone. But the backend stores their start/end as
 * UTC-midnight-anchored instants (startUtc: "2026-09-27T00:00:00+00:00"),
 * and passing that raw offset-tagged string into the schedule library
 * breaks the all-day-ness of it: the library (and dayjs, re-parsing a
 * value we format without an offset) treats it as a real instant and
 * converts to the BROWSER's local timezone for grid/drag math. West of
 * UTC that shifts the apparent calendar day backward -- confirmed live:
 * dragging a 1-day, Sep 27 all-day event produced drop data with start
 * "2026-09-23 17:00:00" (not "00:00:00"), because UTC midnight Sep 27 is
 * 5pm the PREVIOUS day in Pacific time. MonthView, seeing a start/end
 * that genuinely land on two different local calendar days, correctly
 * (from its own point of view) rendered and dragged it as a 2-day span.
 *
 * Fix: extract the civil (UTC) calendar date/time from the stored instant
 * and re-emit it as a plain offset-free local-looking string via
 * dayjs(...).utc().format(...), rather than relying on the browser's
 * local offset -- which is what silently "worked" before, and only by
 * luck, for `end` but never for `start`. Every all-day boundary -- start
 * AND end -- must go through this; never pass an all-day event's raw
 * *Utc string through untouched.
 */
function toAllDayBoundary(value: string | dayjs.Dayjs): string {
    return dayjs(value).utc().format("YYYY-MM-DD HH:mm:ss");
}

function toEventStart(event: Pick<CalendarEvent, "startUtc" | "hasTime">): string {
    return event.hasTime === false ? toAllDayBoundary(event.startUtc) : event.startUtc;
}

/**
 * The backend's endUtc for an all-day event is an EXCLUSIVE boundary --
 * midnight of the day after its last day. That's correct for the event's
 * own span, but it collides with a boundary-inclusivity bug in how the
 * library checks an event against Agenda's week/month range: an event
 * whose end lands EXACTLY on a range's start boundary (an Aug 31 event
 * ending at Sep 1 00:00:00, right where September's range begins) gets
 * counted as inside that range. Confirmed empirically -- removing this
 * nudge reproduces the bug immediately, restoring it fixes it. Nudging
 * the end back by one second keeps the event's displayed span identical
 * while moving it off the exact boundary that triggers the bug.
 */
function toEventEnd(event: Pick<CalendarEvent, "endUtc" | "hasTime">): string {
    return event.hasTime === false
        ? toAllDayBoundary(dayjs(event.endUtc).subtract(1, "second"))
        : event.endUtc;
}

function toEventPayload(event: CalendarEvent, colors: string[]): EventColorPayload {
    return {
        colors,
        hasTime: event.hasTime,
        visibility: event.visibility,
        allMembers: event.allMembers,
        attendeeIds: event.attendeeIds,
    };
}

export function toScheduleEvent(event: CalendarEvent, members: HouseholdMemberColor[]): ScheduleEventData {
    const colors = getEventColors(event, members);
    const base = {
        id: event.id,
        title: event.title,
        start: toEventStart(event),
        end: toEventEnd(event),
        color: colors[0],
        payload: toEventPayload(event, colors),
    };
    return (event.rrule ? { ...base, recurrence: { rrule: event.rrule } } : base) as ScheduleEventData;
}

export function toMobileMonthEvents(event: CalendarEvent, members: HouseholdMemberColor[]): ScheduleEventData[] {
    const colors = getEventColors(event, members);
    const basePayload = toEventPayload(event, colors);
    const recurrence = event.rrule ? { recurrence: { rrule: event.rrule } } : {};
    const start = toEventStart(event);
    const end = toEventEnd(event);

    if (colors.length <= 1) {
        return [{
            id: event.id,
            title: event.title,
            start,
            end,
            color: colors[0] ?? "blue",
            payload: basePayload,
            ...recurrence,
        } as ScheduleEventData];
    }

    return colors.map((color, i) => ({
        id: `${event.id}::dot${i}`,
        title: event.title,
        start,
        end,
        color,
        payload: { ...basePayload, isDotSibling: i > 0 },
        ...recurrence,
    } as ScheduleEventData));
}

/**
 * DayView has no notion of an event "continuing" from an earlier day --
 * unlike WeekView (which documents multi-day spanning as a feature) or
 * MonthView (which lays out its own spanning bar), DayView only matches
 * an event to the day its `start` falls on, and only recognizes its
 * all-day slot for events whose boundaries land exactly on midnight. A
 * timed event that crosses midnight without being boundary-aligned is
 * therefore only ever visible on its first day.
 *
 * To make it show up on every day it spans, we produce one segment per
 * day it touches, each clipped to that day's own boundaries -- day 1
 * keeps the real event id (so drag/resize/persistence still resolve to
 * the actual backend event), later days get a synthetic id and are
 * marked non-interactive via isDayViewContinuation.
 *
 * Two things this has to avoid, both learned the hard way:
 *  - Never also hand DayView the original unclipped event alongside the
 *    segments. DayView's embedded Agenda does genuine range-overlap
 *    matching (unlike the grid, which only matches by start day), so an
 *    unclipped multi-day event would double up with its own continuation
 *    segments on every day after the first.
 *  - Never let a segment's end land exactly on the next day's boundary
 *    (day+1 at 00:00:00) -- that's the same range boundary-inclusivity
 *    bug `toEventEnd` works around for real all-day events, and our own
 *    synthetic segments can trip it just as easily.
 *
 * DayView-only -- never mix this into `scheduleEvents`, only pass its
 * output to a standalone <DayView>. Scoped out for now: `hasTime: false`
 * events and recurring events.
 */
export function toDayViewEvents(events: ScheduleEventData[]): ScheduleEventData[] {
    return events.flatMap((event) => {
        const payload = event.payload as EventColorPayload | undefined;
        if (event.recurrence || payload?.hasTime === false) return [event];

        const start = dayjs(event.start);
        const end = dayjs(event.end);
        const firstDay = start.startOf("day");
        const lastDay = end.startOf("day");
        const dayCount = lastDay.diff(firstDay, "day");

        if (dayCount <= 0) return [event];

        const dayBoundaryEnd = (day: ReturnType<typeof dayjs>) =>
            day.add(1, "day").subtract(1, "second").format("YYYY-MM-DD HH:mm:ss");

        const segments: ScheduleEventData[] = [{
            ...event,
            end: dayBoundaryEnd(firstDay),
        } as ScheduleEventData];

        for (let i = 1; i <= dayCount; i++) {
            const day = firstDay.add(i, "day");
            const isFinalDay = i === dayCount;
            segments.push({
                ...event,
                id: `${event.id}::continuation${i}`,
                start: day.format("YYYY-MM-DD HH:mm:ss"),
                end: isFinalDay ? end.format("YYYY-MM-DD HH:mm:ss") : dayBoundaryEnd(day),
                payload: { ...payload, isDayViewContinuation: true },
            } as ScheduleEventData);
        }
        return segments;
    });
}

export function toLightCssColor(color: string): string {
    if (color.startsWith("#") || color.startsWith("rgb") || color.startsWith("hsl")) {
        return `color-mix(in oklab, ${color}, white 78%)`;
    }
    return `var(--mantine-color-${color}-1)`;
}

export function toDotCssColor(color: string): string {
    if (color.startsWith("#") || color.startsWith("rgb") || color.startsWith("hsl")) {
        return color;
    }
    return `var(--mantine-color-${color}-6)`;
}

function toTextCssColor(color: string): string {
    if (color.startsWith("#") || color.startsWith("rgb") || color.startsWith("hsl")) {
        return `color-mix(in oklab, ${color}, black 15%)`;
    }
    return `var(--mantine-color-${color}-9)`;
}

export function getEventTextColor(colors: string[]): string {
    if (colors.length <= 1) return toTextCssColor(colors[0] ?? "blue");
    return "var(--mantine-color-dark-7)";
}