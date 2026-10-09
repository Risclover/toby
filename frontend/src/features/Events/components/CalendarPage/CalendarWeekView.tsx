import type { ComponentProps } from "react";
import { WeekView } from "@mantine/schedule";
import {
    getDateRange,
    getInteractiveViewProps,
    MORE_EVENTS_PROPS,
    toRangeEvents,
    type CalendarViewProps,
} from "../../utils";
import { useCalendar } from "@/contexts";
import { WeekEventButton } from "./WeekEventButton";
import { useCalendarWeekView } from "../../hooks/useCalendarWeekView";

type WeekRenderEvent = NonNullable<ComponentProps<typeof WeekView>["renderEvent"]>;

export const CalendarWeekView = ({ date, onDateChange, onViewChange }: CalendarViewProps) => {
    const { events, modals, moveEvent } = useCalendar();
    const { draggingEventId, handleDragStart, handleDragEnd } = useCalendarWeekView();

    const { start, end } = getDateRange(date, "week");
    const weekEvents = toRangeEvents(events.scheduleEvents, start, end);
    const interactiveProps = getInteractiveViewProps({
        onMove: moveEvent,
        onEventClick: modals.viewEvent,
    });

    const renderEvent: WeekRenderEvent = (event, props) => (
        <WeekEventButton
            event={event}
            buttonProps={props}
            draggingEventId={draggingEventId}
        />
    );

    return (
        <WeekView
            date={date}
            onDateChange={onDateChange}
            onViewChange={onViewChange}
            events={weekEvents}
            withAllDaySlots
            {...interactiveProps}
            onEventDragStart={handleDragStart}
            onEventDragEnd={handleDragEnd}
            onTimeSlotClick={modals.createFromTimeSlot}
            onSlotDragEnd={modals.createFromTimeRange}
            onAllDaySlotClick={modals.createForDay}
            moreEventsProps={MORE_EVENTS_PROPS}
            renderEvent={renderEvent}
        />
    );
};