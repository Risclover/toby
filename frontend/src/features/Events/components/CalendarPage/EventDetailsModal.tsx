import { Badge, Group, Modal, Stack, Text } from "@mantine/core";

import { type ScheduleEventData } from "../../utils";
import { EventActionsMenu } from "./EventActionsMenu";
import { EventMemberDots } from "./EventColorDots";
import { getEventDetails } from "../../utils/getEventDetails";

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

    const { title, timeLabel, recurrenceLabel, isPrivate, colors, memberNames } = details;

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
                    <EventActionsMenu occurrence={occurrence} onDeleted={onClose} />
                </Group>

                <EventMemberDots colors={colors} names={memberNames} />

                <Text size="sm" c="dimmed">{timeLabel}</Text>

                {recurrenceLabel && <Text size="sm" c="dimmed">{recurrenceLabel}</Text>}

                {isPrivate && <Badge color="gray" variant="light" w="fit-content">Private</Badge>}
            </Stack>
        </Modal>
    );
};