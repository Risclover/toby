import { useEffect, useMemo, useState } from "react";
import { useModalsStack } from "@mantine/core";
import type { CalendarEvent } from "@/store";
import type { ModalId } from "../types";
import type { ScheduleEventData } from "../utils/weekAllDayLayout";
import type { HouseholdMemberColor } from "../utils/getEventColors";
import type { EventFormSeed } from "../utils/eventFormSeed";
import { resolveLiveEvent } from "../utils/resolveLiveEvent";

const EVENT_FORM_MODAL_ID: ModalId = "event-form";
const MODAL_STACK_IDS: ModalId[] = ["recurrence", EVENT_FORM_MODAL_ID];

type ReturnModal = "agenda" | "details";

type AgendaControls = {
    isOpened: boolean;
    open: () => void;
    close: () => void;
};

type UseEventModalsProps = {
    agenda: AgendaControls;
    visibleEvents: CalendarEvent[];
    members: HouseholdMemberColor[];
};

type OpenFormProps = {
    event?: CalendarEvent;
    seed?: EventFormSeed;
    returnTo?: ReturnModal;
};

type CloseFormOptions = {
    saved?: boolean;
};

type TimeSlot = {
    slotStart: string;
    slotEnd: string;
};

export const useEventModals = ({ agenda, visibleEvents, members }: UseEventModalsProps) => {
    const stack = useModalsStack<ModalId>(MODAL_STACK_IDS);

    const [selectedEvent, setSelectedEvent] = useState<ScheduleEventData | null>(null);
    const [isDetailsOpened, setIsDetailsOpened] = useState(false);
    const [isFormOpened, setIsFormOpened] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);
    const [formSeed, setFormSeed] = useState<EventFormSeed | null>(null);
    const [returnModal, setReturnModal] = useState<ReturnModal | null>(null);

    const liveEvent = useMemo(
        () => (selectedEvent ? resolveLiveEvent({ selectedEvent, visibleEvents, members }) : null),
        [selectedEvent, visibleEvents, members]
    );

    useEffect(() => {
        if (isDetailsOpened && selectedEvent && !liveEvent) setIsDetailsOpened(false);
    }, [isDetailsOpened, selectedEvent, liveEvent]);

    const openForm = ({ event, seed, returnTo }: OpenFormProps) => {
        setReturnModal(returnTo ?? null);
        setEditingEvent(event);
        setFormSeed(seed ?? null);
        setIsFormOpened(true);
        stack.open(EVENT_FORM_MODAL_ID);
    };

    const closeForm = (options?: CloseFormOptions) => {
        const wasEditingRecurring = Boolean(editingEvent?.rrule);

        setIsFormOpened(false);
        stack.close(EVENT_FORM_MODAL_ID);
        setEditingEvent(undefined);
        setFormSeed(null);

        // liveEvent can't represent a just-saved recurring edit (the edited occurrence may no
        // longer exist), so Details isn't reopened. Agenda re-renders reactively and is safe.
        const skipDetails = options?.saved && wasEditingRecurring;
        if (returnModal === "details" && !skipDetails) setIsDetailsOpened(true);
        else if (returnModal === "agenda") agenda.open();
        setReturnModal(null);
    };

    const viewEvent = (event: ScheduleEventData) => {
        setSelectedEvent(event);
        setIsDetailsOpened(true);
    };

    const closeDetails = () => setIsDetailsOpened(false);

    const editEvent = (event: CalendarEvent) => {
        const returnTo = isDetailsOpened ? "details" : agenda.isOpened ? "agenda" : undefined;

        setIsDetailsOpened(false);
        agenda.close();
        openForm({ event, returnTo });
    };

    const createFromTimeRange = (start: string, end: string) =>
        openForm({ seed: { type: "timeRange", start, end } });

    const createFromTimeSlot = ({ slotStart, slotEnd }: TimeSlot) => createFromTimeRange(slotStart, slotEnd);

    const createFromDayRange = (start: string, end: string) =>
        openForm({ seed: { type: "dayRange", start, end } });

    const createForDay = (date: string) => openForm({ seed: { type: "allDay", date } });

    return {
        stack,
        details: {
            isOpened: isDetailsOpened,
            occurrence: liveEvent,
            eventKey: selectedEvent?.id ?? "none",
            close: closeDetails,
        },
        form: {
            isOpened: isFormOpened,
            editingEvent,
            seed: formSeed,
            close: closeForm,
        },
        viewEvent,
        editEvent,
        createFromTimeRange,
        createFromTimeSlot,
        createFromDayRange,
        createForDay,
    };
};