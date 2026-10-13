import { useDisclosure } from "@mantine/hooks";

import { DeleteConfirmation } from "@/components";
import { useHousehold } from "@/hooks";
import { useAuthenticateQuery, useDeleteEventMutation, type CalendarEvent } from "@/store";
import { DeleteRecurringEventConfirmation, EventMenu, UnassignSelfConfirmation, NotifyEventDeleted } from "..";
import type { Occurrence } from "../../types";
import {
    getEventPermissions,
    getOccurrenceEditEvent,
    type EventColorPayload,
    type ScheduleEventData,
} from "../../utils";

type EventActionsMenuProps = {
    /** One occurrence of a recurring event, or a single-instance event. */
    occurrence: ScheduleEventData;
    /** Opens the edit form, seeded with the occurrence being edited. */
    onEdit: (event: CalendarEvent) => void;
    /** Called after a successful delete. Omit when the caller needs no reaction (an agenda row just disappears). */
    onDeleted?: () => void;
};

/**
 * The 3-dot edit/delete/leave menu for one event occurrence, plus its confirmation dialogs.
 * Shared by EventDetailsModal, the agenda row and the day events list so permissions, the
 * delete mutation and the three dialogs aren't duplicated per call site.
 */
export const EventActionsMenu = ({ occurrence, onEdit, onDeleted }: EventActionsMenuProps) => {
    const { data: currentUser } = useAuthenticateQuery();
    const { data: household } = useHousehold();
    const [deleteEvent] = useDeleteEventMutation();

    const [recurringOpened, recurringHandlers] = useDisclosure(false);
    const [deleteOpened, deleteHandlers] = useDisclosure(false);
    const [leaveOpened, leaveHandlers] = useDisclosure(false);

    const source = (occurrence.payload as EventColorPayload | undefined)?.source;
    if (!source || !currentUser) return null;

    const { canEdit, canLeave, canOpenMenu } = getEventPermissions({ source, userId: currentUser.id });
    if (!canOpenMenu) return null;

    // The confirmation dialogs take the stricter Occurrence type.
    const typedOccurrence = occurrence as Occurrence;
    const openDelete = typedOccurrence.recurringInstance?.isRecurringInstance
        ? recurringHandlers.open
        : deleteHandlers.open;

    const handleEdit = () => onEdit(getOccurrenceEditEvent({ occurrence, source }));

    const handleDeleteEvent = async () => {
        if (!household?.id) return;
        await deleteEvent({ id: source.id, householdId: household.id }).unwrap();
        NotifyEventDeleted(source.title);
        onDeleted?.();
    };

    return (
        <>
            <EventMenu
                canEdit={canEdit}
                canLeave={canLeave}
                onEdit={handleEdit}
                onDelete={openDelete}
                onLeave={leaveHandlers.open}
            />
            <DeleteRecurringEventConfirmation
                opened={recurringOpened}
                onClose={recurringHandlers.close}
                occurrence={typedOccurrence}
                occurrenceStart={typedOccurrence.start}
            />
            <DeleteConfirmation
                itemType="event"
                itemName={source.title}
                modalTitle="Confirm delete event"
                opened={deleteOpened}
                setShowDeleteConfirmation={deleteHandlers.close}
                handleDeleteItem={handleDeleteEvent}
            />
            <UnassignSelfConfirmation
                opened={leaveOpened}
                onClose={leaveHandlers.close}
                occurrence={typedOccurrence}
            />
        </>
    );
};