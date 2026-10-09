import { DayView } from "@mantine/schedule";
import {
    getInteractiveViewProps,
    MORE_EVENTS_PROPS,
    toDayViewEvents,
    type CalendarViewProps,
} from "../../utils";
import { useCalendar } from "@/contexts";

export const CalendarDayView = ({ date, onDateChange, onViewChange }: CalendarViewProps) => {
    const { events, modals, moveEvent } = useCalendar();

    const dayEvents = toDayViewEvents(events.scheduleEvents, date);
    const interactiveProps = getInteractiveViewProps({
        onMove: moveEvent,
        onEventClick: modals.viewEvent,
    });

    return (
        <DayView
            date={date}
            onDateChange={onDateChange}
            onViewChange={onViewChange}
            events={dayEvents}
            withAllDaySlot
            {...interactiveProps}
            onTimeSlotClick={modals.createFromTimeSlot}
            onSlotDragEnd={modals.createFromTimeRange}
            onAllDaySlotClick={modals.createForDay}
            moreEventsProps={MORE_EVENTS_PROPS}
        />
    );
};