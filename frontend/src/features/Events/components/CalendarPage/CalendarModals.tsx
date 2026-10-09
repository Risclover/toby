import { EventForm } from "../EventForm/EventForm";
import { useCalendar } from "@/contexts";
import { EventDetailsModal } from "./EventDetailsModal";
import { getEventFormSeedProps } from "../../utils/eventFormSeed";

type CalendarModalsProps = {
    date: string;
};

export const CalendarModals = ({ date }: CalendarModalsProps) => {
    const { householdId, modals } = useCalendar();
    const { stack, details, form, editEvent } = modals;

    const seedProps = getEventFormSeedProps({ seed: form.seed, fallbackDate: date });

    return (
        <>
            <EventDetailsModal
                key={details.eventKey}
                opened={details.isOpened}
                onClose={details.close}
                occurrence={details.occurrence}
                onEdit={editEvent}
            />
            {householdId ? (
                <EventForm
                    householdId={householdId}
                    opened={form.isOpened}
                    {...seedProps}
                    onClose={form.close}
                    edit={Boolean(form.editingEvent)}
                    event={form.editingEvent}
                    stack={stack}
                />
            ) : null}
        </>
    );
};