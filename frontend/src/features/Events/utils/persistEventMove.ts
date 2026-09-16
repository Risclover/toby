import dayjs from "dayjs";
import type { useCreateEventMutation, useUpdateEventMutation, useExcludeEventOccurrenceMutation } from "@/store";
import type { EventColorPayload } from "./getEventColors";

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

/**
 * All-day events store their boundaries as UTC-midnight instants
 * (startUtc "2026-09-17T00:00:00+00:00", endUtc EXCLUSIVE -- midnight of
 * the day after the last day). newStart/newEnd from the schedule library
 * are civil-date-looking strings with no offset (e.g. "2026-09-17
 * 00:00:00"); naively running them through dayjs(...).toISOString() would
 * reinterpret them in the BROWSER's local timezone and shift the UTC
 * instant off midnight -- the same bug fixed in getEventColors.ts. So for
 * all-day events we pull out just the civil date and re-stamp it as UTC
 * midnight ourselves, never letting dayjs's local-offset conversion touch
 * it. The end also has to roll forward one day, since newEnd represents
 * the last INCLUSIVE day (23:59:59, per the same nudge-back-a-second
 * convention as the read side) but the backend wants an EXCLUSIVE
 * boundary.
 */
const toCivilDate = (value: string) => dayjs(value).format("YYYY-MM-DD");
const toUtcMidnight = (civilDate: string) => `${civilDate}T00:00:00.000Z`;

/**
 * Moving/resizing a recurring occurrence must NOT move the whole series --
 * we detach just that occurrence (exclude-occurrence, same mechanism as a
 * single-occurrence delete) and create a standalone event at the new time,
 * carrying the series' visibility/attendees forward. A non-recurring event
 * just gets updated in place.
 */
export async function persistEventMove(
    { eventId, newStart, newEnd, event }: MoveData,
    { householdId, updateEvent, createEvent, excludeEventOccurrence }: Deps
) {
    const hasTime = event.payload?.hasTime ?? true;
    const scheduleFields = hasTime
        ? { startUtc: dayjs(newStart).toISOString(), endUtc: dayjs(newEnd).toISOString() }
        : {
            startUtc: toUtcMidnight(toCivilDate(newStart)),
            endUtc: toUtcMidnight(dayjs(toCivilDate(newEnd)).add(1, "day").format("YYYY-MM-DD")),
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