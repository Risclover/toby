import { Modal, useModalsStack } from "@mantine/core"
import { EventsModalHeader } from "./EventsModalHeader";
import { EventsModalList } from "./EventsModalList";
import dayjs from "dayjs";
import { type CalendarEvent } from "@/store";
import { useIsSmallScreen } from "@/hooks";


const DAY_HEADER_FORMAT = "dddd, MMMM D";

type Props = {
    householdId: number;
    stack: ReturnType<typeof useModalsStack<'recurrence' | 'event-form' | 'events-list'>> | undefined;
    date: Date;
    setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
    onAddEvent: () => void;
    onEditEvent: (event: CalendarEvent) => void;
}

export const DayEventsModal = ({ stack, date, householdId, onAddEvent, onEditEvent, setSelectedDate }: Props) => {
    const smallScreen = useIsSmallScreen(475);
    const dayEventsStackProps = stack?.register('events-list');

    return (
        <Modal
            {...dayEventsStackProps}
            title={`Events for ${dayjs(date).format(DAY_HEADER_FORMAT)}`}
            opened={dayEventsStackProps?.opened ?? false}
            onClose={() => stack?.closeAll()}
            fullScreen={smallScreen}
            radius="md"
            styles={{ body: { padding: 0 } }}
        >
            <div className="events-modal" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
                <EventsModalHeader date={date} onDateChange={setSelectedDate} onAddEvent={onAddEvent} />
                <EventsModalList
                    householdId={householdId}
                    date={date}
                    onAddEvent={onAddEvent}
                    onEditEvent={onEditEvent}
                />
            </div>
        </Modal>
    )
}