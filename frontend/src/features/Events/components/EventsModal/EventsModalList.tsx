import { useAuthenticateQuery, useGetHouseholdEventsForDayQuery, type User } from "@/store";
import { ActionIcon, Avatar, Group, ScrollArea, Stack, Tooltip } from "@mantine/core";
import { Button, Text } from "@mantine/core";
import { type CalendarEvent, useDeleteEventMutation } from "@/store";
import { useDayEvents } from "../../hooks/useDayEvents";
import { useHousehold, useIsMobile, useIsSmallScreen } from "@/hooks";
import { EventMenu } from "../EventMenu";
import dayjs from "dayjs";
import { MemberDot } from "./MemberDot";
import { formatFullName } from "@/utils/formatFullName";
import { useState } from "react";
import { useClickOutside } from "@mantine/hooks";
import { getEventAttendees } from "../../utils/getEventAttendees";
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';

type Occurrence = ReturnType<typeof useDayEvents>['occurrences'][number];
type MemberLike = {
    id: number;
    firstName: string;
    lastName: string;
    color: string;
    profileImg: string | null;
};
type UserGroup = {
    member: MemberLike;
    events: Occurrence[];
};
type Props = {
    householdId: number;
    date: Date;
    onAddEvent: () => void;
    onEditEvent: (event: CalendarEvent) => void;
    filterValue: string | null;
}
export const EventsModalList = ({ householdId, date, onAddEvent, onEditEvent, filterValue }: Props) => {
    const { occurrences, isLoading } = useDayEvents(householdId, date);
    const [deleteEvent] = useDeleteEventMutation();
    const isMobile = useIsMobile();
    const isSmallScreen = useIsSmallScreen(475);
    const { data: household } = useHousehold();
    const { data: currentUser } = useAuthenticateQuery();
    const [openDotId, setOpenDotId] = useState<string | null>(null);
    const [collapsedMembers, setCollapsedMembers] = useState<Set<number>>(new Set());

    const toggleMemberCollapsed = (memberId: number) => {
        setCollapsedMembers((prev) => {
            const next = new Set(prev);
            next.has(memberId) ? next.delete(memberId) : next.add(memberId);
            return next;
        });
    };
    useClickOutside(() => setOpenDotId(null), null, [], isMobile);

    const handleDelete = (eventId: number) =>
        deleteEvent({ id: eventId, householdId });

    const rowProps = {
        onEdit: onEditEvent,
        onDelete: handleDelete,
        openDotId,
        onOpenDot: setOpenDotId
    }

    const attendeesOf = (occ: Occurrence): MemberLike[] =>
        getEventAttendees((occ.payload as { source: CalendarEvent }).source, household);

    let body: React.ReactNode;

    if (isLoading) {
        body = <Text size="sm">Loading...</Text>;
    } else if (filterValue === "Group by user") {
        const groups: UserGroup[] = (household?.members ?? [])
            .slice()
            .sort((a: MemberLike, b: MemberLike) => {
                if (a.id === currentUser?.id) return -1;
                if (b.id === currentUser?.id) return 1;
                return a.firstName.localeCompare(b.firstName) || a.lastName.localeCompare(b.lastName);
            })
            .map((member: MemberLike): UserGroup => ({
                member,
                events: occurrences.filter((occ: Occurrence) =>
                    attendeesOf(occ).some((m: MemberLike) => m.id === member.id)
                ),
            }))
            .filter((group: UserGroup) => group.events.length > 0);

        body = groups.length === 0 ? (
            <Text c="dimmed" size="sm">No events for this date.</Text>
        ) : (
            groups.map(({ member, events }: UserGroup) => {
                const isCollapsed = collapsedMembers.has(member.id);
                return (
                    <Stack key={member.id} gap={4} mb="sm" p="0 .5rem">
                        <Group gap={8} wrap="nowrap" align="center">
                            <Avatar src={member.profileImg} size={24} radius="xl" />
                            <div className="settings-section-title" style={{ marginBottom: 0, fontSize: "13px" }}> {formatFullName(member)}{member.id === currentUser?.id ? " (You)" : ""}</div>
                            <ActionIcon
                                variant="transparent"
                                color="black"
                                size="sm"
                                radius="sm"
                                onClick={() => toggleMemberCollapsed(member.id)}
                                aria-label={isCollapsed ? `Expand ${formatFullName(member)}` : `Collapse ${formatFullName(member)}`}
                                aria-expanded={!isCollapsed}
                            >
                                <ExpandMoreRoundedIcon
                                    fontSize="small"
                                    style={{
                                        transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)",
                                        transition: "transform 150ms ease",
                                    }}
                                />
                            </ActionIcon>
                        </Group>
                        {!isCollapsed && events.map((occ: Occurrence) => (
                            <DayEventRow key={String(occ.id)} occurrence={occ} {...rowProps} />
                        ))}
                    </Stack>
                );
            })
        );
    } else {
        const visible: Occurrence[] = filterValue === "Mine only" && currentUser
            ? occurrences.filter((occ: Occurrence) =>
                attendeesOf(occ).some((m: MemberLike) => m.id === currentUser.id)
            )
            : occurrences;

        body = visible.length === 0 ? (
            <Text c="dimmed" size="sm">No events for this date.</Text>
        ) : (
            visible.map((occ: Occurrence) => (
                <DayEventRow key={String(occ.id)} occurrence={occ} {...rowProps} />
            ))
        );
    }

    return (
        <div className="events-modal-list">
            <Stack gap={0} p=".5rem">{body}</Stack>
        </div>
    )


    // return (
    //     <div className="events-modal-list">
    //         <Stack gap={0} p=".5rem">
    //             {isLoading ? (
    //                 <Text size="sm">Loading...</Text>
    //             ) : occurrences.length === 0 ? (
    //                 <Text c="dimmed" size="sm">No events for this date.</Text>
    //             ) : (
    //                 occurrences.map((occ) => (
    //                     <DayEventRow key={String(occ.id)} occurrence={occ} onEdit={onEditEvent} onDelete={handleDelete} openDotId={openDotId} onOpenDot={setOpenDotId} />
    //                 ))
    //             )}
    //         </Stack>
    //     </div>
    // )
}

const parseWallClock = (wallClock: string) => new Date(wallClock.replace(" ", "T"));

const formatEventDateTime = (wallClock: string) =>
    dayjs(parseWallClock(wallClock)).format(`MMM D${dayjs().year() !== dayjs(parseWallClock(wallClock)).year() ? ", YYYY" : ""}, h:mma`);


const AttendeeDot = ({
    member,
    dotId,
    openDotId,
    onOpenDot,
}: {
    member: MemberLike;
    dotId: string;
    openDotId: string | null;
    onOpenDot: (id: string) => void;
}) => {
    const isSmallScreen = useIsSmallScreen(475);
    const [localOpened, setLocalOpened] = useState(false);
    const opened = isSmallScreen ? openDotId === dotId : localOpened;

    const handleOpenedChange = (val: boolean) => {
        if (isSmallScreen) {
            if (val) onOpenDot(dotId);
            // val === false on mobile means "the dot that's already open
            // was tapped again" (see MemberDot's onClick toggle) -- per
            // your spec, that's a no-op, not a close.
        } else {
            setLocalOpened(val);
        }
    };

    return (
        <Tooltip
            label={
                <Group gap={6} wrap="nowrap">
                    <Avatar src={member.profileImg} size="xs" radius="xl" />
                    <Text size="sm">{formatFullName(member)}</Text>
                </Group>
            }
            withArrow
            position="top"
            transitionProps={{ transition: "pop", duration: 100 }}
            withinPortal
            events={{ hover: true, focus: true, touch: true }}
            opened={opened}
        >
            <MemberDot color={member.color} name={formatFullName(member)} opened={opened} setOpened={handleOpenedChange} />
        </Tooltip>
    );
};

type DayEventRowProps = {
    occurrence: ReturnType<typeof useDayEvents>['occurrences'][number];
    onEdit: (event: CalendarEvent) => void;
    onDelete: (eventId: number) => void;
    openDotId: string | null;
    onOpenDot: (id: string) => void;
}

const DayEventRow = ({
    occurrence,
    onEdit,
    onDelete,
    openDotId,
    onOpenDot,
}: DayEventRowProps) => {
    const { data: currentUser } = useAuthenticateQuery();
    const { data: household } = useHousehold();
    const source = (occurrence.payload as { source: CalendarEvent }).source;
    const realId = Number(occurrence.recurringInstance?.recurringEventId ?? occurrence.id);

    const startDay = dayjs(parseWallClock(occurrence.start as string)).format("YYYY-MM-DD");
    const endDay = dayjs(parseWallClock(occurrence.end as string)).format("YYYY-MM-DD");
    const isMultiDay = startDay !== endDay;

    let timeLabel: string;
    if (!source.hasTime) {
        timeLabel = "All day";
    } else if (isMultiDay) {
        timeLabel = `${formatEventDateTime(occurrence.start as string)} - ${formatEventDateTime(occurrence.end as string)}`;
    } else {
        timeLabel = `${dayjs(parseWallClock(occurrence.start as string)).format("h:mma")}${occurrence.end ? ` - ${dayjs(parseWallClock(occurrence.end as string)).format("h:mma")}` : ""}`;
    }

    const attendeesToShow = getEventAttendees(source, household);

    return (
        <div className="event-row">
            <Stack gap={4} maw="100%">
                <Group gap=".25rem" miw={0} maw="100%" wrap="nowrap" justify="space-between" maw="100%">
                    <Group gap={8} maw="calc(100% - 50px)" wrap="nowrap" align="center">
                        <Text lineClamp={1} truncate="end" size="15px" inline c="black" fw={500} miw={0}>{occurrence.title}</Text>
                        <Group gap={3} wrap="nowrap">
                            {attendeesToShow.map((member) => (
                                <AttendeeDot
                                    key={member.id}
                                    member={member}
                                    dotId={`${occurrence.id}-${member.id}`}
                                    openDotId={openDotId}
                                    onOpenDot={onOpenDot}
                                />
                            ))}
                        </Group>
                    </Group>
                    {(source.household.adminId === currentUser.id || source.creatorId === currentUser.id) && (
                        <EventMenu
                            isEditing={false}
                            setIsEditing={(val) => val && onEdit(source)}
                            onDelete={() => onDelete(realId)}
                        />
                    )}
                </Group>
                <Text size="13px" inline fw={400} c="dimmed">{timeLabel}</Text>
            </Stack>
        </div>
    )
}