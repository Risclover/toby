import type { CalendarEvent } from "@/store";
import { EVENT_ID_SEPARATOR } from "./calendarConstants";
import type { ScheduleEventData } from "./calendarTypes";
import { toScheduleEvent, type EventColorPayload, type HouseholdMemberColor } from "./getEventColors";

type RecurringInstance = { recurringEventId?: string | number };

type OccurrenceEvent = ScheduleEventData & { recurringInstance?: RecurringInstance };

type ResolveLiveEventProps = {
    selectedEvent: OccurrenceEvent;
    visibleEvents: CalendarEvent[];
    members: HouseholdMemberColor[];
};

/**
 * Continuation/dot segments carry synthetic ids ("<id>::continuation2", "<id>::dot1");
 * recurring occurrences carry recurringInstance.recurringEventId instead.
 */
const getMasterId = (event: OccurrenceEvent) =>
    event.recurringInstance?.recurringEventId ?? String(event.id).split(EVENT_ID_SEPARATOR)[0];

/**
 * Refreshes a click-time snapshot against current data. A recurring event keeps the clicked
 * occurrence's own start/end, since the source record only holds the series' first occurrence.
 * originalStart/originalEnd come from the clicked segment, as toScheduleEvent never sets them.
 */
export const resolveLiveEvent = ({
    selectedEvent,
    visibleEvents,
    members,
}: ResolveLiveEventProps): ScheduleEventData | null => {
    const masterId = getMasterId(selectedEvent);
    const source = visibleEvents.find((event) => String(event.id) === String(masterId));
    if (!source) return null;

    const fresh = toScheduleEvent(source, members);
    const selectedPayload = selectedEvent.payload as EventColorPayload | undefined;
    const isRecurring = Boolean(source.rrule);
    const originalSpan = selectedPayload?.originalStart
        ? { originalStart: selectedPayload.originalStart, originalEnd: selectedPayload.originalEnd }
        : {};

    return {
        ...selectedEvent,
        ...(isRecurring ? {} : { title: fresh.title, start: fresh.start, end: fresh.end }),
        color: fresh.color,
        payload: { ...fresh.payload, ...originalSpan },
    };
};