import { Stack, Text } from "@mantine/core";
import { useState } from "react";
import { useClickOutside } from "@mantine/hooks";
import { type CalendarEvent, useAuthenticateQuery, useDeleteEventMutation } from "@/store";
import { useDayEvents } from "../../hooks/useDayEvents";
import { useHousehold, useIsMobile } from "@/hooks";
import { DayEventRow } from "./DayEventRow";
import { MemberEventGroups } from "./MemberEventGroups";
import { getEventAttendees, type DayEventRowSharedProps, type MemberLike, type Occurrence, type UserGroup } from "../../types";

type Props = {
    householdId: number;
    date: Date;
    onAddEvent: () => void;
    onEditEvent: (event: CalendarEvent) => void;
    filterValue: string | null;
}

const FlatEventList = ({ occurrences, rowProps }: { occurrences: Occurrence[]; rowProps: DayEventRowSharedProps }) => {
    if (occurrences.length === 0) {
        return <Text c="dimmed" size="sm">No events for this date.</Text>;
    }
    return (
        <>
            {occurrences.map((occ) => <DayEventRow key={String(occ.id)} occurrence={occ} {...rowProps} />)}
        </>
    );
};

export const EventsModalList = ({ householdId, date, onAddEvent, onEditEvent, filterValue }: Props) => {
    const { occurrences, isLoading } = useDayEvents({ householdId, date });
    const [deleteEvent] = useDeleteEventMutation();
    const { data: currentUser } = useAuthenticateQuery();
    const { data: household } = useHousehold();
    const isMobile = useIsMobile();
    const [openDotId, setOpenDotId] = useState<string | null>(null);

    useClickOutside(() => setOpenDotId(null), null, [], isMobile);

    const handleDelete = (eventId: number) => deleteEvent({ id: eventId, householdId });
    const rowProps: DayEventRowSharedProps = { onEdit: onEditEvent, onDelete: handleDelete, openDotId, onOpenDot: setOpenDotId };
    const attendeesOf = (occ: Occurrence): MemberLike[] =>
        getEventAttendees((occ.payload as { source: CalendarEvent }).source, household);

    const groups: UserGroup[] = (household?.members ?? [])
        .slice()
        .sort((a: MemberLike, b: MemberLike) => {
            if (a.id === currentUser?.id) return -1;
            if (b.id === currentUser?.id) return 1;
            return a.firstName.localeCompare(b.firstName) || a.lastName.localeCompare(b.lastName);
        })
        .map((member: MemberLike): UserGroup => ({
            member,
            events: occurrences.filter((occ: Occurrence) => attendeesOf(occ).some((m: MemberLike) => m.id === member.id)),
        }))
        .filter((group: UserGroup) => group.events.length > 0);

    const visible: Occurrence[] = filterValue === "Mine only" && currentUser
        ? occurrences.filter((occ: Occurrence) => attendeesOf(occ).some((m: MemberLike) => m.id === currentUser.id))
        : occurrences;

    return (
        <div className="events-modal-list">
            <Stack gap={0} p=".5rem">
                {isLoading ? (
                    <Text size="sm">Loading...</Text>
                ) : filterValue === "Group by user" ? (
                    <MemberEventGroups groups={groups} currentUserId={currentUser?.id} rowProps={rowProps} />
                ) : (
                    <FlatEventList occurrences={visible} rowProps={rowProps} />
                )}
            </Stack>
        </div>
    );
};