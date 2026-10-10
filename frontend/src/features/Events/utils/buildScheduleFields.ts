import dayjs from "dayjs";

import { toAllDayEndUtc, toAllDayStartUtc } from "./allDayBoundary";
import { DEFAULT_EVENT_DURATION_HOURS } from "./calendarConstants";
import { combineLocalFromStrings } from "./combineLocalFromStrings";
import type { EventFormValues } from "./eventFormValues";

const getBrowserTzid = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

const getTimedRange = ({ startDate, endDate, startTime, endTime }: EventFormValues) => {
    const startLocal = combineLocalFromStrings(startDate, startTime);
    const endLocal = endTime
        ? combineLocalFromStrings(endDate || startDate, endTime)
        : dayjs(startLocal).add(DEFAULT_EVENT_DURATION_HOURS, "hour").toDate();

    return { startUtc: startLocal.toISOString(), endUtc: endLocal.toISOString() };
};

/**
 * Schedule-related fields of a create/update payload (everything except id, householdId and rrule).
 * hasTime is always sent explicitly: a PATCH that omitted it would leave an edited all-day event
 * stuck at hasTime: false while its times became real UTC instants, and its occurrences would vanish.
 */
export const buildScheduleFields = (values: EventFormValues) => {
    const tzid = getBrowserTzid();
    const shared = {
        title: values.title.trim(),
        tzid,
        visibility: values.visibility,
        allMembers: values.allMembers,
        attendeeIds: values.assignedUserIds,
    };

    if (values.allDay) {
        return {
            ...shared,
            startUtc: toAllDayStartUtc(values.startDate, tzid),
            endUtc: toAllDayEndUtc(values.endDate || values.startDate, tzid),
            hasTime: false,
        };
    }

    return { ...shared, ...getTimedRange(values), hasTime: true };
};

export type ScheduleFields = ReturnType<typeof buildScheduleFields>;