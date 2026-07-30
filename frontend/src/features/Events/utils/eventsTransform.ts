import type { CalendarEvent } from '@/store';

export function toWallClockString(isoWithOffset: string): string {
    return isoWithOffset.slice(0, 19).replace('T', ' ');
}

export interface EventPayload {
    hasTime: boolean;
    creatorId: number;
    attendees: CalendarEvent['attendees'];
    attendeeIds: number[];
    visibility: CalendarEvent['visibility'];
    allMembers: boolean;
    [key: string]: unknown;
}

export function apiEventToScheduleEvent(e: CalendarEvent) {
    const base = {
        id: e.id,
        title: e.title,
        start: toWallClockString(e.startUtc),
        end: toWallClockString(e.endUtc),
        color: e.displayColor,
        payload: {
            hasTime: e.hasTime,
            creatorId: e.creatorId,
            attendees: e.attendees,
            attendeeIds: e.attendeeIds,
            visibility: e.visibility,
            allMembers: e.allMembers,
        } satisfies EventPayload,
    };

    return e.rrule ? { ...base, recurrence: { rrule: e.rrule } } : base;
}