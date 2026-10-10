import { useState } from "react";

import dayjs from "dayjs";

import type { UseFormReturnType } from "@mantine/form";

import {
    useCreateEventMutation,
    useExcludeEventOccurrenceMutation,
    useUpdateEventMutation,
    type CalendarEvent,
} from "@/store";

import type { EditScope } from "../components/EditRecurringEventConfirmation";
import "../utils/dayjsPlugins";
import {
    DEFAULT_TZID,
    buildRRule,
} from "../utils";
import type { EventFormRecurrence } from "./useEventFormRecurrence";
import { buildScheduleFields, type ScheduleFields } from "../utils/buildScheduleFields";
import type { EventFormValues } from "../utils/eventFormValues";

const OCCURRENCE_START_FORMAT = "YYYY-MM-DD HH:mm:ss";

export type EventFormCloseOptions = {
    /** Distinguishes a successful save from a Cancel/close-X, so the caller knows whether data it shows again may be stale. */
    saved?: boolean;
};

type PendingSave = {
    scheduleFields: ScheduleFields;
    rrule: ReturnType<typeof buildRRule>;
};

type CreateFields = ScheduleFields & Partial<Pick<PendingSave, "rrule">>;

type UseEventFormSaveProps = {
    form: UseFormReturnType<EventFormValues>;
    recurrence: Pick<EventFormRecurrence, "repeatKind" | "customRule">;
    householdId: number;
    edit: boolean;
    event?: CalendarEvent;
    onClose: (options?: EventFormCloseOptions) => void;
};

export function useEventFormSave({
    form,
    recurrence,
    householdId,
    edit,
    event,
    onClose,
}: UseEventFormSaveProps) {
    const [createEvent, { isLoading: creating }] = useCreateEventMutation();
    const [updateEvent, { isLoading: updating }] = useUpdateEventMutation();
    const [excludeEventOccurrence, { isLoading: excluding }] = useExcludeEventOccurrenceMutation();

    // Editing a recurring event stashes the built fields here while the user picks which occurrences the edit applies to.
    const [pendingSave, setPendingSave] = useState<PendingSave | null>(null);
    const [scopeOpened, setScopeOpened] = useState(false);

    const isSaving = creating || updating || excluding;

    const create = (fields: CreateFields) =>
        createEvent({ householdId, ...fields } as Parameters<typeof createEvent>[0]).unwrap();

    const closeScopeModal = () => setScopeOpened(false);

    const discardPending = () => {
        setPendingSave(null);
        setScopeOpened(false);
    };

    const save = async () => {
        const { hasErrors } = form.validate();
        if (hasErrors) return;

        try {
            const values = form.getValues();
            const scheduleFields = buildScheduleFields(values);
            const rrule = buildRRule(
                recurrence.repeatKind,
                recurrence.customRule,
                dayjs(values.startDate),
                !values.allDay,
            );

            if (edit && event) {
                if (event.rrule) {
                    setPendingSave({ scheduleFields, rrule });
                    setScopeOpened(true);
                    return;
                }
                await updateEvent({ id: event.id, householdId, ...scheduleFields, rrule }).unwrap();
                onClose({ saved: true });
                return;
            }

            await create({ ...scheduleFields, rrule });
            onClose();
        } catch (e) {
            console.error(e);
        }
    };

    const confirmScope = async (scope: EditScope) => {
        if (!event || !pendingSave) return;
        const { scheduleFields, rrule } = pendingSave;

        try {
            if (scope === "all-events") {
                await updateEvent({ id: event.id, householdId, ...scheduleFields, rrule }).unwrap();
            } else {
                // "Just this event": exclude the clicked occurrence from the series (event.startUtc/tzid already
                // hold that occurrence's values), then create a standalone, non-recurring event with the edits.
                // Same exclude-and-recreate pattern as persistEventMove and DeleteRecurringEventConfirmation.
                const occurrenceStart = dayjs(event.startUtc)
                    .tz(event.tzid ?? DEFAULT_TZID)
                    .format(OCCURRENCE_START_FORMAT);

                await excludeEventOccurrence({ id: event.id, householdId, occurrenceStart }).unwrap();
                await create(scheduleFields);
            }
            discardPending();
            onClose({ saved: true });
        } catch (e) {
            console.error(e);
        }
    };

    return { isSaving, save, confirmScope, discardPending, scopeOpened, closeScopeModal };
}