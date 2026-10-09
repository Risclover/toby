import type { ComponentProps } from "react";
import { Group, UnstyledButton } from "@mantine/core";
import { MobileMonthView } from "@mantine/schedule";
import type { CalendarViewProps, EventColorPayload } from "../../utils";
import { AddEventButton } from "./AddEventButton";
import { useCalendar } from "@/contexts";
import { CalendarMemberFilter } from "./CalendarMemberFilter";
import { EventRow } from "./EventRow";
import { MobileMonthHeader } from "./MobileMonthHeader";
import { useCalendarMobileMonthView } from "../../hooks/useCalendarMobileMonthView";

// Mantine's own header (a non-interactive month label) and per-event day dots (one per event,
// capped at 3, not customizable) are hidden: MobileMonthHeader and the getDayProps color stripe replace them.
const HIDDEN_MOBILE_PARTS = {
    mobileMonthViewHeader: { display: "none" },
    mobileMonthViewDayIndicators: { display: "none" },
};

type MobileRenderEvent = NonNullable<ComponentProps<typeof MobileMonthView>["renderEvent"]>;

type DotSiblingPayload = EventColorPayload & { isDotSibling?: boolean };

type CalendarMobileMonthViewProps = Pick<CalendarViewProps, "date" | "onDateChange">;

// toMobileMonthEvents fans a multi-attendee event out into one marker per member. All but one are
// hidden so the list shows one row per real event. They must render a hidden element, not null.
const renderMobileEvent: MobileRenderEvent = (event, props) => {
    const payload = event.payload as DotSiblingPayload | undefined;

    if (payload?.isDotSibling) return <UnstyledButton {...props} display="none" />;

    return <EventRow event={event} buttonProps={props} />;
};

export const CalendarMobileMonthView = ({ date, onDateChange }: CalendarMobileMonthViewProps) => {
    const { events, modals } = useCalendar();
    const {
        selectedDate,
        setSelectedDate,
        events: mobileEvents,
        getDayProps,
        navigation,
    } = useCalendarMobileMonthView({
        date,
        onDateChange,
        scheduleEvents: events.scheduleEvents,
    });

    return (
        <>
            <Group justify="space-between" mb="xs" wrap="nowrap">
                <CalendarMemberFilter />
                <AddEventButton />
            </Group>
            <MobileMonthHeader date={date} navigation={navigation} />
            <MobileMonthView
                date={date}
                onDateChange={onDateChange}
                selectedDate={selectedDate}
                onSelectedDateChange={setSelectedDate}
                events={mobileEvents}
                renderEvent={renderMobileEvent}
                onEventClick={modals.viewEvent}
                getDayProps={getDayProps}
                styles={HIDDEN_MOBILE_PARTS}
            />
        </>
    );
};