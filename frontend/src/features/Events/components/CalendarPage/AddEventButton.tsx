import { ButtonStandard } from "@/components";
import { useCalendar } from "@/contexts";
import { toDateString } from "../../utils";

export const AddEventButton = () => {
    const { modals } = useCalendar();
    const handleClick = () => modals.createForDay(toDateString())

    return <ButtonStandard label="Add event" variant="light" onClick={handleClick} />;
};