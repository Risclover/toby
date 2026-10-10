import { useEffect, useRef } from "react";

import type { UseFormReturnType } from "@mantine/form";

import { useHousehold } from "@/hooks";
import { useAuthenticateQuery, useGetUserSettingsQuery, type CalendarEvent } from "@/store";

import type { EventFormRecurrence } from "./useEventFormRecurrence";
import { toDateString, type EventFormSeedProps } from "../utils";
import type { EventFormValues } from "./useEventForm";

const PRIVATE_BY_DEFAULT_MODE = "private_by_default";

type UseEventFormSeedProps = EventFormSeedProps & {
    form: UseFormReturnType<EventFormValues>;
    recurrence: Pick<EventFormRecurrence, "restart">;
    opened: boolean;
    event?: CalendarEvent;
};

/** Resets the form to a fresh baseline (blank add, or the given event) whenever the modal opens. */
export function useEventFormSeed({
    form,
    recurrence,
    opened,
    event,
    initialDate,
    initialStartTime,
    initialEndTime,
    initialEndDate,
}: UseEventFormSeedProps) {
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useHousehold();
    const { data: userSettings } = useGetUserSettingsQuery(user.id);

    // Set by EventFormTimes once the user edits the end time; cleared on every new baseline.
    const endTimeManuallySetRef = useRef(false);

    const applyBaseline = (values: EventFormValues) => {
        form.setValues(values);
        form.setInitialValues(values);
    };

    const seedBlank = () => {
        const isPrivateByDefault = userSettings?.settings.eventsPrivacyMode === PRIVATE_BY_DEFAULT_MODE;

        recurrence.restart();
        applyBaseline(
            getBlankFormValues({
                date: toDateString(initialDate),
                endDate: initialEndDate,
                startTime: initialStartTime,
                endTime: initialEndTime,
                userId: user.id,
                visibility: isPrivateByDefault ? PRIVATE_VISIBILITY : DEFAULT_VISIBILITY,
            }),
        );
    };

    const seedFromEvent = (targetEvent: CalendarEvent) => {
        const { values, repeatKind, customRule } = getEventFormState({
            event: targetEvent,
            allHouseholdMemberIds: household?.members?.map((member: { id: number }) => member.id) ?? [],
            userId: user.id,
        });

        recurrence.restart({ repeatKind, customRule });
        applyBaseline(values);
    };

    useEffect(() => {
        if (!opened) return;

        if (event?.id) {
            seedFromEvent(event);
        } else {
            seedBlank();
        }
        endTimeManuallySetRef.current = false;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, event?.id, initialDate.getTime(), initialStartTime, initialEndTime, initialEndDate]);

    return { endTimeManuallySetRef };
}