import type { CalendarEvent } from "@/store";

type MemberLike = {
    id: number;
    firstName: string;
    lastName: string;
    color: string;
    profileImg: string | null;
};


export const getEventAttendees = (source: CalendarEvent, household?: { members: MemberLike[] }): MemberLike[] =>
    source.allMembers ? household?.members ?? [] : source.attendees;