import { Modal, Stack, Group, Text, Badge } from "@mantine/core";
import dayjs from "dayjs";
import type { ComponentProps } from "react";
import type { Schedule } from "@mantine/schedule";
import type { CalendarEvent } from "@/store";
import { EventMemberDots } from "./EventColorDots";
import { EventActionsMenu } from "./EventActionsMenu";
import type { EventColorPayload } from "../../utils/getEventColors";

type ScheduleEventData = NonNullable<ComponentProps<typeof Schedule>["events"]>[number];

const parseWallClock = (value: string | Date) =>
    typeof value === "string" ? new Date(value.replace(" ", "T")) : value;

const formatDateTime = (value: string | Date) =>
    dayjs(parseWallClock(value)).format(`MMM D${dayjs().year() !== dayjs(parseWallClock(value)).year() ? ", YYYY" : ""}, h:mma`);

const describeRecurrence = (rrule?: string | null) => {
    if (!rrule) return null;
    const freqMatch = rrule.match(/FREQ=(\w+)/);
    const freq = freqMatch?.[1]?.toLowerCase();
    const label = freq === "daily" ? "Repeats daily"
        : freq === "weekly" ? "Repeats weekly"
            : freq === "monthly" ? "Repeats monthly"
                : freq === "yearly" ? "Repeats yearly"
                    : "Repeats";
    return label;
};

type Props = {
    opened: boolean;
    onClose: () => void;
    occurrence: ScheduleEventData | null;
    onEdit: (event: CalendarEvent) => void;
};

export const EventDetailsModal = ({ opened, onClose, occurrence, onEdit }: Props) => {
    if (!occurrence) return null;

    const payload = occurrence.payload as EventColorPayload | undefined;
    const source = payload?.source;
    if (!source) return null;

    const start = occurrence.start as string;
    const end = occurrence.end as string;
    const startDay = dayjs(parseWallClock(start)).format("YYYY-MM-DD");
    const endDay = dayjs(parseWallClock(end)).format("YYYY-MM-DD");
    const isMultiDay = startDay !== endDay;

    let timeLabel: string;
    if (payload?.hasTime === false) {
        timeLabel = isMultiDay
            ? `${dayjs(parseWallClock(start)).format("MMM D")} \u2013 ${dayjs(parseWallClock(end)).format("MMM D")}`
            : "All day";
    } else if (isMultiDay) {
        timeLabel = `${formatDateTime(start)} \u2013 ${formatDateTime(end)}`;
    } else {
        timeLabel = `${dayjs(parseWallClock(start)).format("h:mma")} \u2013 ${dayjs(parseWallClock(end)).format("h:mma")}`;
    }

    const recurrenceLabel = describeRecurrence((occurrence as any).recurrence?.rrule);
    const isPrivate = payload?.visibility && payload.visibility !== "public";

    return (
        <Modal opened={opened} onClose={onClose} title="Event details" radius="md" centered>
            <Stack gap="sm">
                <Group justify="space-between" wrap="nowrap">
                    <Text fz={18} fw={600}>{occurrence.title}</Text>
                    <EventActionsMenu occurrence={occurrence} onEdit={onEdit} onDeleted={onClose} />
                </Group>

                <Text size="sm" c="dimmed">{timeLabel}</Text>

                <EventMemberDots colors={payload?.colors ?? []} names={payload?.memberNames} />

                {recurrenceLabel && <Text size="sm" c="dimmed">{recurrenceLabel}</Text>}

                {isPrivate && <Badge color="gray" variant="light" w="fit-content">Private</Badge>}
            </Stack>
        </Modal>
    );
};