import { Avatar, Group, Stack, Text, Tooltip } from "@mantine/core";
import dayjs from "dayjs";
import { useState } from "react";
import { type CalendarEvent, habitSlice, useAuthenticateQuery, useDeleteEventMutation } from "@/store";
import { useHousehold, useIsSmallScreen, useIsTruncated } from "@/hooks";
import { MemberDot } from "./MemberDot";
import { formatFullName } from "@/utils/formatFullName";
import { getEventAttendees, type DayEventRowSharedProps, type MemberLike, type Occurrence } from "../../types";
import { EventMenu } from "../EventMenu";
import { useDisclosure } from "@mantine/hooks";
import { DeleteRecurringEventConfirmation } from "../DeleteRecurringEventConfirmation";
import { DeleteConfirmation, KittyNotification } from "@/components";
import { KittyIcons } from "@/assets";

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

type DayEventRowProps = DayEventRowSharedProps & {
    occurrence: Occurrence;
    groupOwnerId?: number;
};
export const DayEventRow = ({ occurrence, onEdit, openDotId, onOpenDot, groupOwnerId }: DayEventRowProps) => {
    const { ref: titleRef, isTruncated } = useIsTruncated<HTMLParagraphElement>();
    const { data: currentUser } = useAuthenticateQuery();
    const { data: household } = useHousehold();
    const [deleteEvent] = useDeleteEventMutation();
    const source = (occurrence.payload as { source: CalendarEvent }).source;
    const realId = Number(occurrence.recurringInstance?.recurringEventId ?? occurrence.id);

    console.log('event to be deleted:', occurrence);
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

    const [opened, { open, close }] = useDisclosure(false);
    const [secondOpened, secondHandlers] = useDisclosure(false);

    const handleDeleteEvent = async () => {
        await deleteEvent({ id: Number(occurrence.payload?.source.id), householdId: household.id }).unwrap();
        KittyNotification({
            title: "Event deleted",
            message: <>Done - "<strong style={{ fontWeight: 500 }}>{occurrence.payload?.source.title}</strong>" has been removed from your events. Later, gator!</>,
            color: "green",
            icon: KittyIcons.Huggy
        })
    }
    return (
        <div className="event-row">
            <Stack gap={4}>
                <Group gap=".25rem" miw={0} wrap="nowrap" justify="space-between" w="100%">
                    <Group gap={8} miw={0} wrap="nowrap">
                        <Tooltip
                            position="top"
                            transitionProps={{ transition: "pop", duration: 100 }}
                            withinPortal
                            events={{ hover: true, focus: true, touch: true }}
                            maw="95%"
                            withArrow
                            label={occurrence.title}
                            disabled={!isTruncated}
                            multiline
                        >
                            <Text ref={titleRef} size="15px" inline c="black" fw={500} truncate miw={0}>
                                {occurrence.title}
                            </Text>
                        </Tooltip>
                        <Group gap={3} wrap="nowrap" style={{ flexShrink: 0 }}>
                            {attendeesToShow.map((member) => (
                                <AttendeeDot
                                    key={member.id}
                                    member={member}
                                    dotId={`${groupOwnerId ?? "flat"}-${occurrence.id}-${member.id}`}
                                    openDotId={openDotId}
                                    onOpenDot={onOpenDot}
                                />
                            ))}
                        </Group>
                    </Group>
                    {(source.household.adminId === currentUser.id || source.creatorId === currentUser.id) && (
                        <EventMenu isEditing={false} setIsEditing={(val) => val && onEdit(source)} occurrence={occurrence} opened={opened} open={open} close={close} secondOpened={secondOpened} secondHandlers={secondHandlers} />
                    )}
                </Group>
                <Text size="13px" inline fw={400} c="dimmed">{timeLabel}</Text>
            </Stack>
            <DeleteRecurringEventConfirmation opened={opened} onClose={close} />
            <DeleteConfirmation
                itemType="event"
                itemName={occurrence.payload?.source.title}
                modalTitle="Confirm delete event"
                opened={secondOpened}
                setShowDeleteConfirmation={secondHandlers.close}
                handleDeleteItem={handleDeleteEvent}
            />
        </div>
    );
};