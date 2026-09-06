import { type CalendarEvent } from "@/store";
import type { useDayEvents } from "./hooks/useDayEvents";

export type Occurrence = ReturnType<typeof useDayEvents>['occurrences'][number];

export type MemberLike = {
    id: number;
    firstName: string;
    lastName: string;
    color: string;
    profileImg: string | null;
};

export type UserGroup = {
    member: MemberLike;
    events: Occurrence[];
};

export type DayEventRowSharedProps = {
    onEdit: (event: CalendarEvent) => void;
    onDelete: (eventId: number) => void;
    openDotId: string | null;
    onOpenDot: (id: string) => void;
};

export const getEventAttendees = (source: CalendarEvent, household?: { members: MemberLike[] }): MemberLike[] =>
    source.allMembers ? household?.members ?? [] : source.attendees;