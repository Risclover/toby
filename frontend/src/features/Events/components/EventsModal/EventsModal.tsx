import { useIsSmallScreen } from "@/hooks";
import { Modal, useModalsStack } from "@mantine/core"
import { EventsModalHeader } from "./EventsModalHeader";
import { EventsModalList } from "./EventsModalList";

type Props = {
    stack: ReturnType<typeof useModalsStack<'recurrence' | 'event-form' | 'events-list'>> | undefined;
    date: Date;
}

export const EventsModal = ({ stack, date }: Props) => {
    const isSmallScreen = useIsSmallScreen(475);
    const todaysEventsStackProps = stack?.register('events-list');
    const todaysDate = new Date();

    return (
        <Modal
            {...todaysEventsStackProps}
            title={`Events (${todaysDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric', day: 'numeric' })})`}
            size="sm"
            radius="md"
            fullScreen={isSmallScreen}
            centered
            opened={todaysEventsStackProps?.opened ?? false}
            onClose={() => stack?.close('events-list')}
        >
            <div className="events-modal">
                <EventsModalHeader />
                {/** 
                     * OPTIONS:
                     * - date: (shows the date clicked on; can be changed to another date)
                     * - "my events only" switch toggle
                     * - group by household member (each member's name is a header, with their events listed below)
                     * - "Today" button (jumps to today's date; refreshes the list if already on today's date?)
                */}

                <EventsModalList />
                {/* Render the list of today's events here */}
            </div>
        </Modal>
    )
}