import dayjs from "dayjs";

import type { CalendarEvent } from "@/store";

import "./dayjsPlugins";
import { DEFAULT_EVENT_COLOR, DEFAULT_TZID, WALL_CLOCK_FORMAT } from "./calendarConstants";
import type { ScheduleEventData } from "./calendarTypes";
import type { EventColorPayload, HouseholdMemberColor } from "./eventColorPayload";
import { getAssignedMembers } from "./getEventColors";
import { isAllDayValue } from "./isAllDayValue";

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

function toEventPayload(event: CalendarEvent, colors: string[], memberNames: string[]): EventColorPayload {
    return {
        colors,
        memberNames,
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
    const memberNames = assigned.map((m) => m.firstName);
    const base = {
        id: event.id,
        title: event.title,
        start: toEventStart(event),
        end: toEventEnd(event),
        color: colors[0],
        // Mantine's own all-day flag, separate from payload.hasTime. Without it an all-day event lands in the timed grid.
        allDay: isAllDayValue(event.hasTime),
        payload: toEventPayload(event, colors, memberNames),
    };
    return { ...base, ...toRecurrence(event) } as ScheduleEventData;
}