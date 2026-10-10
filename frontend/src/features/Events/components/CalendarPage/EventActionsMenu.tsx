import { useDisclosure } from "@mantine/hooks";

import { DeleteConfirmation } from "@/components";
import { useHousehold } from "@/hooks";
import { useAuthenticateQuery, useDeleteEventMutation } from "@/store";

import type { Occurrence } from "../../types";
import {
    type EventColorPayload,
    type ScheduleEventData,
} from "../../utils";
import { DeleteRecurringEventConfirmation } from "../DeleteRecurringEventConfirmation";
import { EventMenu } from "../EventMenu";
import { UnassignSelfConfirmation } from "../UnassignSelfConfirmation";
import { useCalendar } from "@/contexts";
import { notifyEventDeleted } from "./notifyEventDeleted";
import { getEventPermissions } from "../../utils/getEventPermissions";
import { getOccurrenceEditEvent } from "../../utils/getOccurrenceEditEvent";

type EventActionsMenuProps = {
    /** One occurrence of a recurring event, or a single-instance event. */
    occurrence: ScheduleEventData;
    /** Called after a successful delete. Omit when the caller needs no reaction (an agenda row just disappears). */
    onDeleted?: () => void;
};

/**
 * The 3-dot edit/delete/leave menu for one event occurrence, plus its confirmation dialogs.
 * Shared by EventDetailsModal and the agenda row so permissions, the delete mutation and the
 * three dialogs aren't duplicated per call site.
 */
export const EventActionsMenu = ({ occurrence, onDeleted }: EventActionsMenuProps) => {
    const { data: currentUser } = useAuthenticateQuery();
    const { data: household } = useHousehold();
    const { modals } = useCalendar();
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

    const handleEdit = () => modals.editEvent(getOccurrenceEditEvent({ occurrence, source }));

    const handleDeleteEvent = async () => {
        if (!household?.id) return;
        await deleteEvent({ id: source.id, householdId: household.id }).unwrap();
        notifyEventDeleted(source.title);
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