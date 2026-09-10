import type { CalendarEvent } from "@/store";
import type { MemberLike } from "../types";

export const getEventAttendees = (source: CalendarEvent, household?: { members: MemberLike[] }): MemberLike[] =>
    source.allMembers ? household?.members ?? [] : source.attendees;