import type { ComponentProps } from "react";
import { AgendaView } from "@mantine/schedule";
import { useCalendar } from "@/contexts";
import { EventRow } from "./CalendarPage";

type AgendaViewProps = ComponentProps<typeof AgendaView>;
type AgendaRenderEvent = NonNullable<AgendaViewProps["renderEvent"]>;

const renderAgendaEvent: AgendaRenderEvent = (event, props) => (
    <EventRow event={event} buttonProps={props} />
);

type Props = {
    range: { start: string; end: string };
    events: AgendaViewProps["events"];
    /** Styles API overrides, e.g. to hide AgendaView's own date headers. */
    styles?: AgendaViewProps["styles"];
};

/** Agenda list used by the calendar's agenda modal and the homepage's Upcoming This Week. */
export const AgendaList = ({ range, events, styles }: Props) => {
    const { modals } = useCalendar();

    return (
        <AgendaView
            rangeStart={range.start}
            rangeEnd={range.end}
            events={events}
            renderEvent={renderAgendaEvent}
            onEventClick={modals.viewEvent}
            styles={styles}
        />
    );
};