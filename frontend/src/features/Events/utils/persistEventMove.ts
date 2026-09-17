import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { useCreateEventMutation, useUpdateEventMutation, useExcludeEventOccurrenceMutation } from "@/store";
import type { EventColorPayload } from "./getEventColors";

dayjs.extend(utc);
dayjs.extend(timezone);

type MoveData = {
    eventId: string | number;
    newStart: string;
    newEnd: string;
    event: {
        title: string;
        payload?: EventColorPayload;
        recurringInstance?: { isRecurringInstance: boolean; recurringEventId: string | number; recurrenceId: string };
    };
};

type Deps = {
    householdId: number;
    updateEvent: ReturnType<typeof useUpdateEventMutation>[0];
    createEvent: ReturnType<typeof useCreateEventMutation>[0];
    excludeEventOccurrence: ReturnType<typeof useExcludeEventOccurrenceMutation>[0];
};

const toCivilDate = (value: string) => dayjs(value).format("YYYY-MM-DD");

/**
 * Inverse of toAllDayBoundary in getEventColors.ts: given a plain civil
 * date and the event's own tzid, reconstruct the UTC instant for midnight
 * of that date IN THAT TIMEZONE -- mirroring how the create-event form
 * works (sends `date` + `tzid`, backend converts) and how the backend
 * actually stores these values.
 */
const toUtcInstant = (civilDate: string, tzid: string) =>
    dayjs.tz(civilDate, tzid).startOf("day").toISOString();

/**
 * The backend's update-event endpoint infers hasTime from which fields
 * are present: startUtc/endUtc alone always sets has_time = True, and
 * the date-only path (the only other way to signal all-day) can't
 * express a multi-day range at all. So an all-day drag has to send
 * startUtc/endUtc (to preserve a multi-day span) AND an explicit
 * hasTime: false (so the backend doesn't force it back to timed) --
 * dropping either one reproduces one of the two bugs this works around.
 */
export async function persistEventMove(
    { eventId, newStart, newEnd, event }: MoveData,
    { householdId, updateEvent, createEvent, excludeEventOccurrence }: Deps
) {
    const hasTime = event.payload?.hasTime ?? true;
    const tzid = event.payload?.tzid ?? "UTC";
    const scheduleFields = hasTime
        ? { startUtc: dayjs(newStart).toISOString(), endUtc: dayjs(newEnd).toISOString() }
        : {
            startUtc: toUtcInstant(toCivilDate(newStart), tzid),
            endUtc: toUtcInstant(dayjs(toCivilDate(newEnd)).add(1, "day").format("YYYY-MM-DD"), tzid),
            hasTime: false,
        };

    if (event.recurringInstance?.isRecurringInstance) {
        await excludeEventOccurrence({
            id: Number(event.recurringInstance.recurringEventId),
            householdId,
            occurrenceStart: event.recurringInstance.recurrenceId,
        }).unwrap();

        await createEvent({
            householdId,
            title: event.title,
            visibility: event.payload?.visibility,
            allMembers: event.payload?.allMembers,
            attendeeIds: event.payload?.attendeeIds,
            ...scheduleFields,
        } as any).unwrap();
        return;
    }

    await updateEvent({
        id: Number(eventId),
        householdId,
        ...scheduleFields,
    }).unwrap();
}