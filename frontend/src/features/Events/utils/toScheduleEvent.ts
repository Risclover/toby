import dayjs from "dayjs";

import type { CalendarEvent } from "@/store";

import "./dayjsPlugins";
import { DEFAULT_EVENT_COLOR, DEFAULT_TZID, WALL_CLOCK_FORMAT } from "./calendarConstants";
import type { ScheduleEventData } from "./calendarTypes";
import { getAssignedMembers, toEventMember } from "./getEventColors";
import { isAllDayValue } from "./isAllDayValue";
import type { EventColorPayload, EventMember, HouseholdMemberColor } from "./eventColorPayload";

function toAllDayBoundary(value: string | dayjs.Dayjs, tzid: string): string {
    return dayjs(value).tz(tzid).format(WALL_CLOCK_FORMAT);
}

function toEventStart(event: Pick<CalendarEvent, "startUtc" | "hasTime" | "tzid">): string {
    return isAllDayValue(event.hasTime) ? toAllDayBoundary(event.startUtc, event.tzid ?? DEFAULT_TZID) : event.startUtc;
}

function toEventEnd(event: Pick<CalendarEvent, "endUtc" | "hasTime" | "tzid">): string {
    return isAllDayValue(event.hasTime)
        ? toAllDayBoundary(dayjs(event.endUtc).subtract(1, "second"), event.tzid ?? DEFAULT_TZID)
        : event.endUtc;
}

function toEventPayload(event: CalendarEvent, colors: string[], members: EventMember[]): EventColorPayload {
    return {
        colors,
        members,
        // Normalized to a real boolean here, so downstream `payload.hasTime === false` checks are safe.
        hasTime: !isAllDayValue(event.hasTime),
        visibility: event.visibility,
        allMembers: event.allMembers,
        attendeeIds: event.attendeeIds,
        tzid: event.tzid ?? DEFAULT_TZID,
        source: event,
    };
}

/**
 * Mantine only learns about excluded occurrences from recurrence.exdate on the event object, so the
 * backend's exdate has to be copied in here, or a detached occurrence still shows in the series.
 */
function toRecurrence(event: Pick<CalendarEvent, "rrule" | "exdate">) {
    return event.rrule ? { recurrence: { rrule: event.rrule, exdate: event.exdate ?? [] } } : {};
}

export function toScheduleEvent(event: CalendarEvent, members: HouseholdMemberColor[]): ScheduleEventData {
    const assigned = getAssignedMembers(event, members);
    const colors = assigned.length > 0 ? assigned.map((m) => m.color) : [event.color ?? DEFAULT_EVENT_COLOR];
    const eventMembers = assigned.map(toEventMember); // changed
    const base = {
        id: event.id,
        title: event.title,
        start: toEventStart(event),
        end: toEventEnd(event),
        color: colors[0],
        // Mantine's own top-level allDay flag - separate from our payload.hasTime,
        // which only drives our own formatting/display logic. Without this, the
        // library places an all-day event in the timed grid using raw start/end.
        allDay: isAllDayValue(event.hasTime),
        payload: toEventPayload(event, colors, eventMembers), // changed
    };
    return { ...base, ...toRecurrence(event) } as ScheduleEventData;
}