import dayjs from "dayjs";
import { Modal, useModalsStack } from "@mantine/core"

import { EventsModalHeader } from "./EventsModalHeader";
import { EventsModalList } from "./EventsModalList";
import { type CalendarEvent } from "@/store";
import { useDayEvents } from "../../hooks/useDayEvents";

const DAY_HEADER_FORMAT = "dddd, MMMM D"; // e.g., "Saturday, September 5"

type Props = {
    householdId: number;
    // Modal stack 
    stack: ReturnType<typeof useModalsStack<'recurrence' | 'event-form' | 'events-list'>> | undefined;
    // Modal's selected date 
    date: Date;
    setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
    // Function for when the 'add event' button is clicked 
    onAddEvent: () => void;
    // Function for when the user clicks the 'Edit' button for a specific event (event menu)
    onEditEvent: (event: CalendarEvent) => void;
}

export const DayEventsModal = ({ stack, date, householdId, onAddEvent, onEditEvent, setSelectedDate }: Props) => {
    const {
        dayEventsStackProps,
        isSmallScreen,
        filterValue,
        setFilterValue
    } = useDayEvents({ householdId, date, stack });

    return (
        <Modal
            {...dayEventsStackProps}
            title={`Events for ${dayjs(date).format(DAY_HEADER_FORMAT)}`}
            opened={dayEventsStackProps?.opened ?? false}
            onClose={() => stack?.closeAll()}
            fullScreen={isSmallScreen}
            radius="md"
            styles={{ body: { padding: 0 } }}
        >
            <div className="events-modal">
                <EventsModalHeader
                    date={date}
                    onDateChange={setSelectedDate}
                    onAddEvent={onAddEvent}
                    filterValue={filterValue}
                    onFilterChange={setFilterValue}
                    householdId={householdId}
                />
                <EventsModalList
                    householdId={householdId}
                    date={date}
                    onAddEvent={onAddEvent}
                    onEditEvent={onEditEvent}
                    filterValue={filterValue}
                />
            </div>
        </Modal>
    )
}