import type { CalendarEvent } from "@/store";

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
    /** The event's true full span, set on every day-segment of a split multi-day event. */
    originalStart?: string;
    originalEnd?: string;
    isDayViewContinuation?: boolean;
    isDotSibling?: boolean;
    [key: string]: unknown;
};