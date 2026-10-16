import type { CalendarEvent } from "@/store";
import type { MemberLike, Occurrence, UserGroup } from "../types";
import { getEventAttendees } from "./getEventAttendees";

type Household = Parameters<typeof getEventAttendees>[1];

type MemberOccurrencesProps = {
    occurrences: Occurrence[];
    household: Household;
    memberId: number;
};

type GroupProps = {
    occurrences: Occurrence[];
    household: Household;
    currentUserId?: number;
};

const getOccurrenceAttendees = (occurrence: Occurrence, household: Household): MemberLike[] =>
    getEventAttendees((occurrence.payload as { source: CalendarEvent }).source, household);

/** Occurrences the given household member is attending. */
export const getMemberOccurrences = ({
    occurrences,
    household,
    memberId,
}: MemberOccurrencesProps): Occurrence[] =>
    occurrences.filter((occurrence) =>
        getOccurrenceAttendees(occurrence, household).some((attendee) => attendee.id === memberId)
    );

const byCurrentUserThenName = (currentUserId?: number) => (a: MemberLike, b: MemberLike) => {
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    return a.firstName.localeCompare(b.firstName) || a.lastName.localeCompare(b.lastName);
};

/** One group per household member with events, current user first, then alphabetical. */
export const groupOccurrencesByMember = ({
    occurrences,
    household,
    currentUserId,
}: GroupProps): UserGroup[] => {
    const members: MemberLike[] = household?.members ?? [];

    return [...members]
        .sort(byCurrentUserThenName(currentUserId))
        .map((member) => ({
            member,
            events: getMemberOccurrences({ occurrences, household, memberId: member.id }),
        }))
        .filter((group) => group.events.length > 0);
};