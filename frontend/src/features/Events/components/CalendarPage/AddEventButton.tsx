import { ButtonStandard } from "@/components/ButtonStandard";
import { toDateString } from "../../utils";
import { useCalendar } from "@/contexts";

export const AddEventButton = () => {
    const { modals } = useCalendar();

    // EventForm needs a real date to seed itself with, and no times means it opens as all-day.
    const handleClick = () => modals.createForDay(toDateString());

    return <ButtonStandard label="Add event" variant="light" onClick={handleClick} />;
};