import type { ComponentProps, MouseEvent } from "react";
import { Group, Stack, Text, UnstyledButton } from "@mantine/core";
import { useCalendar } from "@/contexts";
import { EventActionsMenu } from "./EventActionsMenu";
import { EventMemberDots } from "./EventColorDots";
import type { ScheduleEventData } from "../../utils/calendarTypes";
import type { EventColorPayload } from "../../utils/getEventColors";
import { getEventTimeLabel } from "../..";

const TEXT_STACK_STYLE = { flex: 1, minWidth: 0 };

// Keeps a tap on the menu from also triggering the row's own click (opens event details).
const stopPropagation = (event: MouseEvent) => event.stopPropagation();

type EventRowProps = {
    event: ScheduleEventData;
    buttonProps: ComponentProps<typeof UnstyledButton>;
};

export const EventRow = ({ event, buttonProps }: EventRowProps) => {
    const { modals } = useCalendar();

    const payload = event.payload as EventColorPayload | undefined;
    const colors = payload?.colors ?? [event.color];
    const timeLabel = getEventTimeLabel({
        start: event.start,
        end: event.end,
        hasTime: payload?.hasTime !== false,
    });

    return (
        <UnstyledButton
            {...buttonProps}
            w="100%"
            px={4}
            py={8}
        >
            <Group justify="space-between" wrap="nowrap" align="flex-start">
                <Stack gap={4} style={TEXT_STACK_STYLE}>
                    <Text fz={14} fw={500} c="black">{event.title}</Text>
                    <EventMemberDots colors={colors} names={payload?.memberNames} />
                    <Text fz={12} c="dimmed">{timeLabel}</Text>
                </Stack>
                <div onClick={stopPropagation}>
                    <EventActionsMenu occurrence={event} onEdit={modals.editEvent} />
                </div>
            </Group>
        </UnstyledButton>
    );
};