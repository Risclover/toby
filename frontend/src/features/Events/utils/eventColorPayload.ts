import type { CalendarEvent } from "@/store";

export type HouseholdMemberColor = {
    id: number;
    color: string;
    firstName: string;
    lastName: string;
    profileImg?: string | null;
};

/** What a member dot's tooltip needs: a display name and an avatar. */
export type EventMember = {
    name: string;
    profileImg?: string | null;
};

export type EventColorPayload = {
    colors: string[];
    /** Same order as `colors`; empty when the event has no assigned members. */
    members: EventMember[];
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