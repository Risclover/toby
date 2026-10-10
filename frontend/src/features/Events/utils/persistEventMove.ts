import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import type {
    useCreateEventMutation,
    useExcludeEventOccurrenceMutation,
    useUpdateEventMutation,
} from "@/store";
import { DATE_FORMAT, DEFAULT_TZID } from "./calendarConstants";
import { type EventColorPayload } from "./eventColorPayload"

dayjs.extend(utc);
dayjs.extend(timezone);

type MovePayload = Partial<
    Pick<EventColorPayload, "hasTime" | "tzid" | "visibility" | "allMembers" | "attendeeIds">
>;

type RecurringInstance = {
    isRecurringInstance: boolean;
    recurringEventId: string | number;
    recurrenceId: string;
};

export type MoveData = {
    eventId: string | number;
    newStart: string;
    newEnd: string;
    event: {
        title: string;
        payload?: MovePayload;
        recurringInstance?: RecurringInstance;
    };
};

type Deps = {
    householdId: number;
    updateEvent: ReturnType<typeof useUpdateEventMutation>[0];
    createEvent: ReturnType<typeof useCreateEventMutation>[0];
    excludeEventOccurrence: ReturnType<typeof useExcludeEventOccurrenceMutation>[0];
};

type ScheduleFieldsProps = {
    hasTime: boolean;
    tzid: string;
    newStart: string;
    newEnd: string;
};

const toCivilDate = (value: string) => dayjs(value).format(DATE_FORMAT);

/** Inverse of toAllDayBoundary: the UTC instant of midnight on a civil date in the event's own timezone. */
const toUtcInstant = (civilDate: string, tzid: string) =>
    dayjs.tz(civilDate, tzid).startOf("day").toISOString();

/**
 * The update endpoint infers hasTime from which fields are present: startUtc/endUtc alone always
 * sets it true, and the date-only path can't express a multi-day range. An all-day move therefore
 * needs startUtc/endUtc (to keep the span) AND an explicit hasTime: false. Dropping either breaks it.
 */
const getScheduleFields = ({ hasTime, tzid, newStart, newEnd }: ScheduleFieldsProps) => {
    if (hasTime) {
        return {
            startUtc: dayjs(newStart).toISOString(),
            endUtc: dayjs(newEnd).toISOString(),
        };
    }

    return {
        startUtc: toUtcInstant(toCivilDate(newStart), tzid),
        endUtc: toUtcInstant(dayjs(toCivilDate(newEnd)).add(1, "day").format(DATE_FORMAT), tzid),
        hasTime: false,
    };
};

export const persistEventMove = async (
    { eventId, newStart, newEnd, event }: MoveData,
    { householdId, updateEvent, createEvent, excludeEventOccurrence }: Deps
) => {
    const { title, payload, recurringInstance } = event;
    const scheduleFields = getScheduleFields({
        hasTime: payload?.hasTime ?? true,
        tzid: payload?.tzid ?? DEFAULT_TZID,
        newStart,
        newEnd,
    });

    if (recurringInstance?.isRecurringInstance) {
        await excludeEventOccurrence({
            id: Number(recurringInstance.recurringEventId),
            householdId,
            occurrenceStart: recurringInstance.recurrenceId,
        }).unwrap();

        await createEvent({
            householdId,
            title,
            visibility: payload?.visibility,
            allMembers: payload?.allMembers,
            attendeeIds: payload?.attendeeIds,
            ...scheduleFields,
        } as Parameters<Deps["createEvent"]>[0]).unwrap();
        return;
    }

    await updateEvent({
        id: Number(eventId),
        householdId,
        ...scheduleFields,
    }).unwrap();
};