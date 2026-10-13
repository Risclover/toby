import { useHousehold, useIsTruncated } from "@/hooks";
import type { CalendarEvent } from "@/store";
import type { Occurrence } from "../types";
import { getDayEventTimeLabel } from "../utils/dayEventTimeLabel";
import { getEventAttendees } from "../utils/getEventAttendees";
import { isAllDayValue } from "../utils/isAllDayValue";
import { wallClockToInstant } from "../utils/wallClockToInstant";

type Props = {
    occurrence: Occurrence;
};

export function useDayEventRow({ occurrence }: Props) {
    const { ref: titleRef, isTruncated } = useIsTruncated<HTMLParagraphElement>();
    const { data: household } = useHousehold();
    const { source } = occurrence.payload as { source: CalendarEvent };

    const isAllDay = isAllDayValue(source.hasTime);
    const start = occurrence.start as string;
    const end = occurrence.end as string;

    // The actions menu expects timed occurrences as real instants, like the calendar views
    // provide; this list works in wall-clock strings.
    const actionsOccurrence = isAllDay
        ? occurrence
        : { ...occurrence, start: wallClockToInstant(start), end: wallClockToInstant(end) };

    return {
        titleRef,
        isTruncated,
        actionsOccurrence,
        timeLabel: getDayEventTimeLabel({ start, end, isAllDay }),
        attendees: getEventAttendees(source, household),
    };
}