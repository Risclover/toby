import dayjs from "dayjs";

import type { CalendarEvent } from "@/store";
import type { MemberLike, Occurrence, UserGroup } from "../types";
import { getEventAttendees } from "./getEventAttendees";

type Household = Parameters<typeof getEventAttendees>[1];

type TimeLabelProps = {
    /** Wall-clock start, "YYYY-MM-DD HH:mm:ss" */
    start: string;
    /** Wall-clock end, "YYYY-MM-DD HH:mm:ss" */
    end: string;
    isAllDay: boolean;
};

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

const TIME_FORMAT = "h:mma";
const DATE_TIME_FORMAT = "MMM D, h:mma";
const DATE_TIME_YEAR_FORMAT = "MMM D, YYYY, h:mma";
const ALL_DAY_LABEL = "All day";
const RANGE_SEPARATOR = " - ";

const formatDateTime = (value: dayjs.Dayjs) =>
    value.format(value.year() === dayjs().year() ? DATE_TIME_FORMAT : DATE_TIME_YEAR_FORMAT);

/** "All day", a same-day time range, or a full date-time range for multi-day occurrences. */
export const getDayEventTimeLabel = ({ start, end, isAllDay }: TimeLabelProps) => {
    if (isAllDay) return ALL_DAY_LABEL;

    const startTime = dayjs(start);
    const endTime = dayjs(end);

    if (!startTime.isSame(endTime, "day")) {
        return `${formatDateTime(startTime)}${RANGE_SEPARATOR}${formatDateTime(endTime)}`;
    }

    return `${startTime.format(TIME_FORMAT)}${RANGE_SEPARATOR}${endTime.format(TIME_FORMAT)}`;
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