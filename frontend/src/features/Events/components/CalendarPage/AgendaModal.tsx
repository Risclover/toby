import type { ComponentProps } from "react";
import { ActionIcon, Button, Group, Modal, Text } from "@mantine/core";
import { AgendaView } from "@mantine/schedule";
import { useCalendar } from "@/contexts";
import { CalendarMemberFilter } from "./CalendarMemberFilter";
import { EventRow } from "./EventRow";
import { toRangeEvents } from "../../utils/getEventColors";

// AgendaView's own date headers are hidden in single-day mode: its event list isn't reliably
// filtered to the one day, so we always show our own label instead of trusting which header renders.
const HIDDEN_AGENDA_HEADERS = {
    agendaViewHeader: { display: "none" },
    agendaViewDateHeader: { display: "none" },
};

type AgendaRenderEvent = NonNullable<ComponentProps<typeof AgendaView>["renderEvent"]>;

const renderAgendaEvent: AgendaRenderEvent = (event, props) => (
    <EventRow event={event} buttonProps={props} />
);

export const AgendaModal = () => {
    const { agenda, events, modals } = useCalendar();

    const agendaEvents = toRangeEvents(events.scheduleEvents, agenda.range.start, agenda.range.end);

    const handlePrevious = () => agenda.step(-1);
    const handleNext = () => agenda.step(1);

    return (
        <Modal
            opened={agenda.isOpened}
            onClose={agenda.close}
            title={agenda.title}
            size="lg"
        >
            <Group justify="space-between" mb="sm">
                <CalendarMemberFilter />
                <Group gap={4}>
                    <Button size="xs" variant="subtle" onClick={agenda.goToToday}>Today</Button>
                    <ActionIcon variant="light" onClick={handlePrevious} aria-label="Previous">‹</ActionIcon>
                    <ActionIcon variant="light" onClick={handleNext} aria-label="Next">›</ActionIcon>
                </Group>
            </Group>
            {agenda.isSingleDay && (
                <Text
                    c="black"
                    mb="xs"
                    bg="gray.1"
                    px={12}
                    py={8}
                >
                    {agenda.singleDayLabel}
                </Text>
            )}
            <AgendaView
                rangeStart={agenda.range.start}
                rangeEnd={agenda.range.end}
                events={agendaEvents}
                renderEvent={renderAgendaEvent}
                onEventClick={modals.viewEvent}
                styles={agenda.isSingleDay ? HIDDEN_AGENDA_HEADERS : undefined}
            />
        </Modal>
    );
};