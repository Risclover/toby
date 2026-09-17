import type { ComponentProps } from "react";
import type { Schedule } from "@mantine/schedule";
import type { CalendarEvent } from "@/store";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

type ScheduleEventData = NonNullable<ComponentProps<typeof Schedule>["events"]>[number];

export type HouseholdMemberColor = { id: number; color: string; firstName: string };

export type EventColorPayload = {
    colors: string[];
    memberNames: string[];
    hasTime: boolean;
    visibility: string;
    allMembers: boolean;
    attendeeIds: number[];
    tzid: string;
    source: CalendarEvent;
    [key: string]: unknown;
};

function getAssignedMembers(
    event: Pick<CalendarEvent, "attendeeIds" | "allMembers">,
    members: HouseholdMemberColor[]
): HouseholdMemberColor[] {
    const assignedIds = event.allMembers ? members.map((m) => m.id) : event.attendeeIds ?? [];
    const byId = new Map(members.map((m) => [m.id, m]));
    return assignedIds.map((id) => byId.get(id)).filter((m): m is HouseholdMemberColor => Boolean(m));
}

export function getEventColors(
    event: Pick<CalendarEvent, "color" | "attendeeIds" | "allMembers">,
    members: HouseholdMemberColor[]
): string[] {
    const assigned = getAssignedMembers(event, members);
    return assigned.length > 0 ? assigned.map((m) => m.color) : [event.color ?? "blue"];
}

function toAllDayBoundary(value: string | dayjs.Dayjs, tzid: string): string {
    return dayjs(value).tz(tzid).format("YYYY-MM-DD HH:mm:ss");
}

function toEventStart(event: Pick<CalendarEvent, "startUtc" | "hasTime" | "tzid">): string {
    return event.hasTime === false ? toAllDayBoundary(event.startUtc, event.tzid ?? "UTC") : event.startUtc;
}

function toEventEnd(event: Pick<CalendarEvent, "endUtc" | "hasTime" | "tzid">): string {
    return event.hasTime === false
        ? toAllDayBoundary(dayjs(event.endUtc).subtract(1, "second"), event.tzid ?? "UTC")
        : event.endUtc;
}

function toEventPayload(event: CalendarEvent, colors: string[], memberNames: string[]): EventColorPayload {
    return {
        colors,
        memberNames,
        hasTime: event.hasTime,
        visibility: event.visibility,
        allMembers: event.allMembers,
        attendeeIds: event.attendeeIds,
        tzid: event.tzid ?? "UTC",
        source: event,
    };
}

/**
 * The schedule library only learns about excluded occurrences from
 * recurrence.exdate on the event object itself (docs: "generate occurrence
 * start times... remove occurrences that match exdate entries") -- it has
 * no other mechanism. persistEventMove correctly tells the BACKEND to
 * record an exclusion (exclude-occurrence -> event.exdate), but if we
 * never read that back into recurrence.exdate here, the library keeps
 * re-expanding the full, unfiltered rrule on every render. That's why a
 * detached occurrence looked "duplicated" instead of moved: the backend
 * exclusion was real, we just never told the library about it.
 */
function toRecurrence(event: Pick<CalendarEvent, "rrule" | "exdate">) {
    return event.rrule ? { recurrence: { rrule: event.rrule, exdate: event.exdate ?? [] } } : {};
}

export function toScheduleEvent(event: CalendarEvent, members: HouseholdMemberColor[]): ScheduleEventData {
    const assigned = getAssignedMembers(event, members);
    const colors = assigned.length > 0 ? assigned.map((m) => m.color) : [event.color ?? "blue"];
    const memberNames = assigned.map((m) => m.firstName);
    const base = {
        id: event.id,
        title: event.title,
        start: toEventStart(event),
        end: toEventEnd(event),
        color: colors[0],
        payload: toEventPayload(event, colors, memberNames),
    };
    return { ...base, ...toRecurrence(event) } as ScheduleEventData;
}

export function toMobileMonthEvents(event: CalendarEvent, members: HouseholdMemberColor[]): ScheduleEventData[] {
    const assigned = getAssignedMembers(event, members);
    const colors = assigned.length > 0 ? assigned.map((m) => m.color) : [event.color ?? "blue"];
    const memberNames = assigned.map((m) => m.firstName);
    const basePayload = toEventPayload(event, colors, memberNames);
    const recurrence = toRecurrence(event);
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