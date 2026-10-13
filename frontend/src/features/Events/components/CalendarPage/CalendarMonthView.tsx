import { MonthView } from "@mantine/schedule";
import { useCalendar } from "@/contexts";
import {
    getDateRange,
    getInteractiveViewProps,
    MAX_EVENTS_PER_DAY,
    toRangeEvents,
    type CalendarViewProps,
} from "../../utils";

export const CalendarMonthView = ({ date, onDateChange, onViewChange }: CalendarViewProps) => {
    const { events, modals, moveEvent } = useCalendar();
    const { start, end } = getDateRange(date, "monthGrid");

    const monthEvents = toRangeEvents(events.scheduleEvents, start, end);

    const interactiveProps = getInteractiveViewProps({
        onMove: moveEvent,
        onEventClick: modals.viewEvent,
    });

    return (
        <MonthView
            date={date}
            onDateChange={onDateChange}
            onViewChange={onViewChange}
            events={monthEvents}
            maxEventsPerDay={MAX_EVENTS_PER_DAY}
            {...interactiveProps}
            onDayClick={modals.createForDay}
            onSlotDragEnd={modals.createFromDayRange}
        />
    );
};