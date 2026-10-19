import dayjs from "dayjs";
import { useIsSmallScreen } from "@/hooks";
import { EVENTS_MODAL_SMALL_SCREEN_WIDTH } from "../utils";

type Props = {
    /** Date currently shown in the modal */
    date: Date;
    /** Called with the newly chosen date */
    onDateChange: (date: Date) => void;
};

export function useEventsModalDateControls({ date, onDateChange }: Props) {
    const isSmallScreen = useIsSmallScreen(EVENTS_MODAL_SMALL_SCREEN_WIDTH);

    const goToToday = () => onDateChange(new Date());
    const goToPreviousDay = () => onDateChange(dayjs(date).subtract(1, "day").toDate());
    const goToNextDay = () => onDateChange(dayjs(date).add(1, "day").toDate());

    const handleDateChange = (value: string | null) => {
        if (!value) return;
        onDateChange(dayjs(value).toDate());
    };

    return { isSmallScreen, goToToday, goToPreviousDay, goToNextDay, handleDateChange };
}