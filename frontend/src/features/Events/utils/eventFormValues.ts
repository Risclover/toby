import dayjs from "dayjs";

import type { CalendarEvent } from "@/store";

// @ts-ignore -- runtime-only side-effect module without typings
import "./dayjsPlugins";
import { DEFAULT_EVENT_DURATION_HOURS, DEFAULT_TZID, TIME_FORMAT } from "./calendarConstants";
import { hmFromIso, ymdFromIso } from "./fromIso";
import { parseRRule, type CustomRecurrenceRule, type PresetKind } from "./recurrence";
import { roundUpToNearest30Min } from "./roundUpToNearest30Min";
import { isAllDayValue } from "./isAllDayValue";

export const DEFAULT_VISIBILITY = "public";
export const PRIVATE_VISIBILITY = "private";

export type EventFormValues = {
    title: string;
    startDate: string; // "YYYY-MM-DD"
    endDate: string; // "YYYY-MM-DD" | ""
    allDay: boolean;
    startTime: string; // "HH:mm" | ""
    endTime: string; // "HH:mm" | ""
    visibility: string;
    allMembers: boolean;
    assignedUserIds: number[];
};

export type RepeatKind = PresetKind | "custom";

export type EventFormState = {
    values: EventFormValues;
    repeatKind: RepeatKind;
    customRule: CustomRecurrenceRule | null;
};

type BlankFormValuesProps = {
    date: string;
    userId: number;
    visibility: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
};

type FormStateFromEventProps = {
    event: CalendarEvent;
    allHouseholdMemberIds: number[];
    userId: number;
};

const getEventTzid = (event: CalendarEvent) => event.tzid ?? DEFAULT_TZID;

/** All-day ends are stored as an EXCLUSIVE boundary (midnight after the last day), so step back one second to get the inclusive last day. */
const getAllDayEndDate = (endUtc: CalendarEvent["endUtc"], tzid: string) =>
    endUtc ? ymdFromIso(dayjs(endUtc).subtract(1, "second").toISOString(), tzid) : "";

const getAssignedUserIds = ({ event, allHouseholdMemberIds, userId }: FormStateFromEventProps) => {
    if (event.attendeeIds?.length) return event.attendeeIds;
    return event.allMembers ? allHouseholdMemberIds : [userId];
};

export const getEventStartDate = (event: CalendarEvent): string =>
    ymdFromIso(event.startUtc ?? undefined, isAllDayValue(event.hasTime) ? getEventTzid(event) : undefined);

export const getBlankFormValues = ({
    date,
    userId,
    visibility,
    endDate,
    startTime,
    endTime,
}: BlankFormValuesProps): EventFormValues => {
    const hasSlotTimes = Boolean(startTime && endTime);
    const defaultStart = hasSlotTimes ? dayjs(startTime, TIME_FORMAT) : roundUpToNearest30Min(dayjs());
    const defaultEnd = hasSlotTimes
        ? dayjs(endTime, TIME_FORMAT)
        : defaultStart.add(DEFAULT_EVENT_DURATION_HOURS, "hour");

    return {
        title: "",
        startDate: date,
        endDate: endDate && endDate !== date ? endDate : "",
        allDay: !hasSlotTimes,
        startTime: defaultStart.format(TIME_FORMAT),
        endTime: defaultEnd.format(TIME_FORMAT),
        visibility,
        assignedUserIds: [userId],
        allMembers: false,
    };
};

export const getEventFormState = (props: FormStateFromEventProps): EventFormState => {
    const { event } = props;
    const isAllDay = isAllDayValue(event.hasTime);
    const startDate = getEventStartDate(event);
    const endDate = isAllDay
        ? getAllDayEndDate(event.endUtc, getEventTzid(event))
        : ymdFromIso(event.endUtc ?? undefined);
    const { repeatKind, customRule } = parseRRule(event.rrule, dayjs(startDate));

    return {
        repeatKind,
        customRule,
        values: {
            title: event.title,
            startDate,
            endDate: endDate === startDate ? "" : endDate,
            allDay: isAllDay,
            startTime: isAllDay ? "" : hmFromIso(event.startUtc),
            endTime: isAllDay ? "" : hmFromIso(event.endUtc),
            visibility: event.visibility,
            assignedUserIds: getAssignedUserIds(props),
            allMembers: event.allMembers,
        },
    };
};