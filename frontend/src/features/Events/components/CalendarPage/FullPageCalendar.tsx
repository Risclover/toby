import { Schedule } from "@mantine/schedule"
import "../../styles/CalendarPage.css";

export const FullPageCalendar = () => {
    // Time slot click: Open event creation modal form with time slot automatically filled in
    // All day slot click: Open event creation form with 'all day' automatically filled in
    // Day click: Open event creation form with date automatically filled in
    // Event click: Open event information modal
    // Event drop: Update event's time/date (depending on changes)
    // Event resize: Update event's time
    // Slot drag end: Create event with indicated time range/date 
    return (
        <div className="full-page-calendar-container">
            <Schedule
                layout="responsive"
                withEventsDragAndDrop
                withEventResize
                withAgenda
                styles={{
                    dayViewInner: {
                        background: "white"
                    }
                }}
            />
        </div>
    )
}