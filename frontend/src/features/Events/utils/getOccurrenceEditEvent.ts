import dayjs from "dayjs";

import type { CalendarEvent } from "@/store";

import { toAllDayEndUtc, toAllDayStartUtc } from "./allDayBoundary";
import { DATE_FORMAT, DEFAULT_TZID } from "./calendarConstants";
import type { EventSource, ScheduleEventData } from "./calendarTypes";
import type { EventColorPayload } from "./eventColorPayload";
import { isAllDayValue } from "./isAllDayValue";

type OccurrenceEditEventProps = {
    occurrence: ScheduleEventData;
    source: EventSource;
};

/**
 * The event to seed the edit form with for one clicked occurrence. For a recurring event `source`
 * is the series master, whose startUtc/endUtc belong to the FIRST occurrence, so the occurrence's
 * own start/end (or payload.originalStart/End for a Day view continuation) are used instead.
 */
export const getOccurrenceEditEvent = ({
    occurrence,
    source,
}: OccurrenceEditEventProps): CalendarEvent => {
    const payload = occurrence.payload as EventColorPayload | undefined;
    const start = (payload?.originalStart ?? occurrence.start) as string;
    const end = (payload?.originalEnd ?? occurrence.end) as string;

    if (isAllDayValue(source.hasTime)) {
        // start/end are naive, tzid-anchored wall-clock strings: re-derive real UTC boundaries
        // for this occurrence's days, the same way the save path does.
        const tzid = source.tzid ?? DEFAULT_TZID;

        return {
            ...source,
            startUtc: toAllDayStartUtc(dayjs(start).format(DATE_FORMAT), tzid),
            endUtc: toAllDayEndUtc(dayjs(end).format(DATE_FORMAT), tzid),
        };
    }

    // Timed events are raw UTC instants, already shifted to this occurrence when events are expanded.
    return { ...source, startUtc: start, endUtc: end };
};