import type { ScheduleEventData } from "./calendarTypes";
import { describeRecurrence } from "./describeRecurrence";
import type { EventColorPayload } from "./getEventColors";
import { getEventDetailsTimeLabel } from "./getEventTimeLabel";

const PUBLIC_VISIBILITY = "public";

export type EventDetails = {
    title: ScheduleEventData["title"];
    timeLabel: string;
    recurrenceLabel: string | null;
    isPrivate: boolean;
    colors: NonNullable<EventColorPayload["colors"]>;
    memberNames: EventColorPayload["memberNames"];
};

export const getEventDetails = (occurrence: ScheduleEventData): EventDetails | null => {
    const payload = occurrence.payload as EventColorPayload | undefined;
    const source = payload?.source;
    if (!payload || !source) return null;

    // originalStart/originalEnd hold the event's true span; start/end are clipped to one day by toDayViewEvents.
    const start = payload.originalStart ?? occurrence.start;
    const end = payload.originalEnd ?? occurrence.end;

    return {
        title: occurrence.title,
        timeLabel: getEventDetailsTimeLabel({ start, end, hasTime: payload.hasTime !== false }),
        recurrenceLabel: describeRecurrence(source.rrule),
        isPrivate: Boolean(payload.visibility) && payload.visibility !== PUBLIC_VISIBILITY,
        colors: payload.colors ?? [],
        memberNames: payload.memberNames,
    };
};