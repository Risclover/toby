import { Badge, Group, Modal, Stack, Text } from "@mantine/core";

import { useCalendar } from "@/contexts";
import { EventActionsMenu } from "./EventActionsMenu";
import { EventColorDots } from "./EventColorDots";
import { type ScheduleEventData, getEventDetails } from "../../utils";

const MODAL_TITLE = "Event details";
const TITLE_PROPS = { fz: 18, fw: 600 } as const;

type EventDetailsModalProps = {
    opened: boolean;
    onClose: () => void;
    occurrence: ScheduleEventData | null;
};

export const EventDetailsModal = ({ opened, onClose, occurrence }: EventDetailsModalProps) => {
    const details = occurrence ? getEventDetails(occurrence) : null;
    if (!occurrence || !details) return null;

    const { title, timeLabel, recurrenceLabel, isPrivate, colors, members } = details;

    const { modals } = useCalendar();

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={MODAL_TITLE}
            radius="md"
            centered
        >
            <Stack gap="sm">
                <Group justify="space-between" wrap="nowrap">
                    <Text {...TITLE_PROPS}>{title}</Text>
                    <EventActionsMenu occurrence={occurrence} onEdit={modals.editEvent} onDeleted={onClose} />
                </Group>

                <EventColorDots colors={colors} members={members} />

                <Text size="sm" c="dimmed">{timeLabel}</Text>

                {recurrenceLabel && <Text size="sm" c="dimmed">{recurrenceLabel}</Text>}

                {isPrivate && <Badge color="gray" variant="light" w="fit-content">Private</Badge>}
            </Stack>
        </Modal>
    );
};