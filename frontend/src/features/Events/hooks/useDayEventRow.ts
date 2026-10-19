import { useHousehold, useIsTruncated } from "@/hooks";
import type { CalendarEvent } from "@/store";
import type { Occurrence } from "../types";
import { getEventAttendees, isAllDayValue, getDayEventTimeLabel } from "../utils";

type Props = {
    occurrence: Occurrence;
};

export function useDayEventRow({ occurrence }: Props) {
    const { ref: titleRef, isTruncated } = useIsTruncated<HTMLParagraphElement>();
    const { data: household } = useHousehold();
    const { source } = occurrence.payload as { source: CalendarEvent };

    const timeLabel = getDayEventTimeLabel({
        start: occurrence.start as string,
        end: occurrence.end as string,
        isAllDay: isAllDayValue(source.hasTime),
    });

    return {
        titleRef,
        isTruncated,
        source,
        timeLabel,
        attendees: getEventAttendees(source, household),
    };
}