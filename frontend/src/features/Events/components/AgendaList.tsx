import type { ComponentProps } from "react";
import { Box, type BoxProps } from "@mantine/core";
import { AgendaView } from "@mantine/schedule";
import { EventRow } from "./CalendarPage";
import { useCalendar } from "@/contexts";

type AgendaViewProps = ComponentProps<typeof AgendaView>;
type AgendaRenderEvent = NonNullable<AgendaViewProps["renderEvent"]>;

type Props = {
    range: { start: string; end: string };
    events: AgendaViewProps["events"];
    /** Styles API overrides, e.g. to hide AgendaView's own date headers. */
    styles?: AgendaViewProps["styles"];
    /** Wraps each event row in a Box with these props (padding, background...). Omit for the agenda modal's default look. */
    rowProps?: BoxProps;
};

/** Agenda list used by the calendar's agenda modal and the homepage's Upcoming This Week. */
export const AgendaList = ({ range, events, styles, rowProps }: Props) => {
    const { modals } = useCalendar();

    const renderEvent: AgendaRenderEvent = (event, props) => {
        const row = <EventRow event={event} buttonProps={props} />;
        return rowProps ? <Box {...rowProps}>{row}</Box> : row;
    };

    return (
        <AgendaView
            rangeStart={range.start}
            rangeEnd={range.end}
            events={events}
            renderEvent={renderEvent}
            onEventClick={modals.viewEvent}
            styles={styles}
        />
    );
};