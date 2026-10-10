import { Group, Modal, Stack, type useModalsStack } from "@mantine/core";

import { ButtonStandard } from "@/components/ButtonStandard";
import { ModalFooter } from "@/components/ModalFooter";
import { useHousehold, useIsSmallScreen, useModalFocus } from "@/hooks";
import { useAuthenticateQuery, type CalendarEvent } from "@/store";


import type { ModalId } from "../../types";
import "../../utils/dayjsPlugins";
import { toDateString, type EventFormSeedProps } from "../../utils";
import { EditRecurringEventConfirmation } from "../EditRecurringEventConfirmation";
import { EventFormAssignedUsers } from "./EventFormAssignedUsers";
import { EventFormDates } from "./EventFormDates";
import { EventFormTimes } from "./EventFormTimes";
import { EventFormTitle } from "./EventFormTitle";
import { EventFormVisibility } from "./EventFormVisibility";
import { EventFormRepeat } from "./Recurrence/EventFormRepeat";
import { EventFormRepeatCustom } from "./Recurrence/EventFormRepeatCustom";

import "../../styles/QuickAddEvent.css";
import { useEventFormSeed } from "../../hooks/useEventFormSeed";
import { useEventForm } from "../../hooks/useEventForm";
import { useEventFormRecurrence } from "../../hooks/useEventFormRecurrence";
import { useEventFormSave, type EventFormCloseOptions } from "../../hooks/useEventFormSave";
import { getEventStartDate } from "../../utils/eventFormValues";

const FULLSCREEN_BREAKPOINT = 475;
const MODAL_TITLES = { add: "Add event", edit: "Edit event" } as const;
const SAVE_LABELS = { add: "Save", edit: "Update" } as const;

const MODAL_STYLES = {
    body: { display: "flex", flexDirection: "column", height: "100%", padding: 0, overflow: "hidden" },
    content: { overflow: "hidden", maxHeight: "100%", display: "flex", flexDirection: "column" },
} as const;

type EventFormProps = EventFormSeedProps & {
    householdId: number;
    opened: boolean;
    onClose: (options?: EventFormCloseOptions) => void;
    edit: boolean;
    event?: CalendarEvent;
    stack?: ReturnType<typeof useModalsStack<ModalId>>;
};

export function EventForm({
    householdId,
    opened,
    onClose,
    edit,
    event,
    stack,
    ...seedProps
}: EventFormProps) {
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useHousehold();
    const isSmallScreen = useIsSmallScreen(FULLSCREEN_BREAKPOINT);
    const { ref: nameRef, transitionProps } = useModalFocus(!edit);

    const { form, startDate, title, allDay } = useEventForm({
        currentUserId: user.id,
        startDate: event ? getEventStartDate(event) : toDateString(seedProps.initialDate),
    });
    const recurrence = useEventFormRecurrence({ startDate });
    const { endTimeManuallySetRef } = useEventFormSeed({ ...seedProps, form, recurrence, opened, event });
    const { isSaving, save, confirmScope, discardPending, scopeOpened, closeScopeModal } =
        useEventFormSave({ form, recurrence, householdId, edit, event, onClose });

    const mode = edit && event ? "edit" : "add";
    const eventFormStackProps = stack?.register("event-form");
    const hasMultipleMembers = (household?.members?.length ?? 0) > 1;

    const handleClose = () => {
        form.reset();
        recurrence.clear();
        discardPending();
        onClose();
    };

    return (
        <>
            <Modal.Stack>
                <Modal
                    {...eventFormStackProps}
                    opened={eventFormStackProps?.opened ?? opened}
                    transitionProps={transitionProps}
                    onClose={handleClose}
                    radius="md"
                    title={MODAL_TITLES[mode]}
                    centered
                    keepMounted
                    fullScreen={isSmallScreen}
                    styles={MODAL_STYLES}
                >
                    <div className="event-form-modal--body">
                        <EventFormTitle form={form} title={title} nameRef={nameRef} />
                        <Stack gap="md">
                            <Stack gap="sm">
                                <EventFormDates form={form} isSmallScreen={isSmallScreen} />
                                {!allDay && (
                                    <EventFormTimes form={form} endTimeManuallySetRef={endTimeManuallySetRef} />
                                )}
                            </Stack>
                            <EventFormRepeat
                                dateValue={startDate}
                                stack={stack}
                                customRule={recurrence.customRule}
                                repeatKind={recurrence.repeatKind}
                                onRepeatKindChange={recurrence.setRepeatKind}
                            />
                            <EventFormVisibility form={form} />
                            {hasMultipleMembers && <EventFormAssignedUsers form={form} household={household} />}
                        </Stack>
                    </div>
                    <ModalFooter>
                        <Group w="100%" justify="flex-end">
                            <ButtonStandard onClick={handleClose} label="Cancel" variant="outline" />
                            <ButtonStandard
                                onClick={save}
                                isLoading={isSaving}
                                label={SAVE_LABELS[mode]}
                                variant="filled"
                                disabled={!form.isValid()}
                            />
                        </Group>
                    </ModalFooter>
                </Modal>
                <EventFormRepeatCustom
                    key={recurrence.sessionId}
                    stack={stack}
                    dateStr={startDate}
                    onApply={recurrence.applyCustomRule}
                />
            </Modal.Stack>
            <EditRecurringEventConfirmation
                opened={scopeOpened}
                onClose={closeScopeModal}
                onConfirm={confirmScope}
                isSaving={isSaving}
            />
        </>
    );
}