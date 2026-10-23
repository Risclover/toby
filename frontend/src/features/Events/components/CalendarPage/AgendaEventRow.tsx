import type { ComponentProps } from "react";
import type { AgendaView } from "@mantine/schedule";
import { Group, Stack, Text, UnstyledButton } from "@mantine/core";
import dayjs from "dayjs";
import type { CalendarEvent } from "@/store";
import { type EventColorPayload, type ScheduleEventData } from "../../utils";
import { formatEventDate, formatEventDateTime } from "../../utils/formatEventDate";
import { EventMemberDots } from "./EventColorDots";
import { EventActionsMenu } from "./EventActionsMenu";

export type AgendaRenderEvent = NonNullable<ComponentProps<typeof AgendaView>["renderEvent"]>;
type AgendaEventButtonProps = Parameters<AgendaRenderEvent>[1];

type Props = {
    event: ScheduleEventData;
    /** Props Mantine hands renderEvent (click handler, a11y attributes). */
    buttonProps: AgendaEventButtonProps;
    onEdit: (event: CalendarEvent) => void;
};

const getTimeLabel = (event: ScheduleEventData, payload: EventColorPayload | undefined): string => {
    const start = dayjs(event.start);
    const end = dayjs(event.end);
    const isMultiDay = !start.isSame(end, "day");

    if (payload?.hasTime === false) {
        return isMultiDay ? `${formatEventDate(start)} – ${formatEventDate(end)}` : "All day";
    }
    return isMultiDay
        ? `${formatEventDateTime(start)} – ${formatEventDateTime(end)}`
        : `${start.format("h:mma")} – ${end.format("h:mma")}`;
};

/**
 * One row of an agenda list: title, member dots and time on the left, the shared
 * edit/delete/leave menu on the right. The menu sits in a click-stopping wrapper
 * so tapping it doesn't also trigger the row's own click.
 */
export const AgendaEventRow = ({ event, buttonProps, onEdit }: Props) => {
    const payload = event.payload as EventColorPayload | undefined;
    const colors = payload?.colors ?? [event.color as string];

    return (
        <UnstyledButton {...buttonProps} style={{ width: "100%", padding: "8px 4px" }}>
            <Group justify="space-between" wrap="nowrap" align="flex-start">
                <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                    <Text fz={14} fw={500} c="black">{event.title}</Text>
                    <EventMemberDots colors={colors} names={payload?.memberNames} />
                    <Text fz={12} c="dimmed">{getTimeLabel(event, payload)}</Text>
                </Stack>
                <div onClick={(e) => e.stopPropagation()}>
                    <EventActionsMenu occurrence={event} onEdit={onEdit} />
                </div>
            </Group>
        </UnstyledButton>
    );
};