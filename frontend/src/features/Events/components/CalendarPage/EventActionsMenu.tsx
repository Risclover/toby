import type { ComponentProps } from "react";
import dayjs from "dayjs";
import { useDisclosure } from "@mantine/hooks";
import type { Schedule } from "@mantine/schedule";

import { DeleteConfirmation, KittyNotification } from "@/components";
import { EventMenu } from "../EventMenu";
import { DeleteRecurringEventConfirmation } from "../DeleteRecurringEventConfirmation";
import { UnassignSelfConfirmation } from "../UnassignSelfConfirmation";
import { useHousehold } from "@/hooks";
import { useAuthenticateQuery, useDeleteEventMutation, type CalendarEvent } from "@/store";
import { isAllDayValue, type EventColorPayload } from "../../utils/getEventColors";
import { toAllDayStartUtc, toAllDayEndUtc } from "../../utils/allDayBoundary";
import { KittyIcons } from "@/assets";

type ScheduleEventData = NonNullable<ComponentProps<typeof Schedule>["events"]>[number];

type Props = {
    // Specific occurrence of a recurring event, or a single-instance event.
    occurrence: ScheduleEventData;
    // Callback to manage modals in modal stack and resetting event form states
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

    // For a recurring event, `source` is the series' master record, so its
    // own startUtc/endUtc always reflect the series' very FIRST occurrence
    // -- not whichever occurrence was actually clicked. occurrence.start/end
    // (or payload.originalStart/originalEnd, for a Day view continuation
    // segment) reflect the real clicked occurrence and are what the edit
    // form should seed from instead.
    const handleEdit = () => {
        const occStart = (payload?.originalStart ?? occurrence.start) as string;
        const occEnd = (payload?.originalEnd ?? occurrence.end) as string;

        if (isAllDayValue(source.hasTime)) {
            // occStart/occEnd are naive, tzid-anchored "YYYY-MM-DD HH:mm:ss"
            // wall-clock strings (see toAllDayBoundary) -- re-derive real UTC
            // instants for THIS occurrence's calendar day(s) the same way the
            // save path does, rather than reusing the master's own boundaries.
            const tzid = source.tzid ?? "UTC";
            const startDay = dayjs(occStart).format("YYYY-MM-DD");
            const endDay = dayjs(occEnd).format("YYYY-MM-DD");
            onEdit({ ...source, startUtc: toAllDayStartUtc(startDay, tzid), endUtc: toAllDayEndUtc(endDay, tzid) });
        } else {
            // Timed events' start/end are raw UTC instants passed straight
            // through by toEventStart, and Mantine's own recurrence expansion
            // already shifts them to this specific occurrence -- safe to use
            // directly as the edited event's boundaries.
            onEdit({ ...source, startUtc: occStart, endUtc: occEnd });
        }
    };

    return (
        <>
            <EventMenu
                isEditing={false}
                setIsEditing={(val) => {
                    if (val) handleEdit();
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