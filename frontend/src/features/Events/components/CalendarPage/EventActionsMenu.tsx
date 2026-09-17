import type { ComponentProps } from "react";
import { useDisclosure } from "@mantine/hooks";
import type { Schedule } from "@mantine/schedule";
import { useHousehold } from "@/hooks";
import type { CalendarEvent } from "@/store";
import { useAuthenticateQuery, useDeleteEventMutation } from "@/store";
import { DeleteConfirmation, KittyNotification } from "@/components";
import { KittyIcons } from "@/assets";
import type { EventColorPayload } from "../../utils/getEventColors";
import { EventMenu } from "../EventMenu";
import { DeleteRecurringEventConfirmation } from "../DeleteRecurringEventConfirmation";
import { UnassignSelfConfirmation } from "../UnassignSelfConfirmation";

type ScheduleEventData = NonNullable<ComponentProps<typeof Schedule>["events"]>[number];

type Props = {
    occurrence: ScheduleEventData;
    onEdit: (event: CalendarEvent) => void;
    /** Called after a successful delete. Omit if the caller doesn't need to react (e.g. an agenda row just disappears on its own once the live event list updates). */
    onDeleted?: () => void;
};

/**
 * The 3-dot edit/delete/leave menu for a single event occurrence, plus its
 * confirmation dialogs. Shared by EventDetailsModal and the agenda row so
 * that permission-checking, the delete mutation, and the three
 * confirmation modals aren't duplicated per call site.
 */
export const EventActionsMenu = ({ occurrence, onEdit, onDeleted }: Props) => {
    const { data: currentUser } = useAuthenticateQuery();
    const { data: household } = useHousehold();
    const [deleteEvent] = useDeleteEventMutation();

    const [recurringOpened, { open: openRecurring, close: closeRecurring }] = useDisclosure(false);
    const [deleteOpened, deleteHandlers] = useDisclosure(false);
    const [leaveOpened, leaveHandlers] = useDisclosure(false);

    const payload = occurrence.payload as EventColorPayload | undefined;
    const source = payload?.source;

    if (!source || !currentUser) return null;

    const canManage =
        source.household?.adminId === currentUser.id ||
        source.creatorId === currentUser.id ||
        source.attendeeIds.includes(currentUser.id);

    if (!canManage) return null;

    const handleDeleteEvent = async () => {
        if (!household?.id) return;
        await deleteEvent({ id: source.id, householdId: household.id }).unwrap();
        KittyNotification({
            title: "Event deleted",
            message: <>Done - "<strong style={{ fontWeight: 500 }}>{source.title}</strong>" has been removed from your events. Later, gator!</>,
            color: "green",
            icon: KittyIcons.Huggy,
        });
        onDeleted?.();
    };

    return (
        <>
            <EventMenu
                isEditing={false}
                setIsEditing={(val) => {
                    if (val) onEdit(source);
                }}
                occurrence={occurrence as any}
                opened={recurringOpened}
                open={openRecurring}
                close={closeRecurring}
                secondOpened={deleteOpened}
                secondHandlers={deleteHandlers}
                thirdHandlers={leaveHandlers}
            />

            <DeleteRecurringEventConfirmation
                opened={recurringOpened}
                onClose={closeRecurring}
                occurrence={occurrence as any}
                occurrenceStart={occurrence.start as string}
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
                occurrence={occurrence as any}
            />
        </>
    );
};