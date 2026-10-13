import dayjs from "dayjs";
import { YearView } from "@mantine/schedule";

import { useCalendar } from "@/contexts";
import type { CalendarViewProps, ScheduleEventData } from "../../utils";

const DAY_NUMBER_FORMAT = "D";
const MONTH_VIEW = "month";
const NO_EVENTS: ScheduleEventData[] = [];

const renderYearDay = (dateStr: string) => dayjs(dateStr).format(DAY_NUMBER_FORMAT);
const YEAR_DAY_PROPS = { renderDay: renderYearDay };

export const CalendarYearView = ({ date, onDateChange, onViewChange }: CalendarViewProps) => {
    const { agenda } = useCalendar();

    const handleMonthClick = (monthStart: string) => {
        onDateChange(monthStart);
        onViewChange(MONTH_VIEW);
    };

    return (
        <YearView
            date={date}
            onDateChange={onDateChange}
            onViewChange={onViewChange}
            onMonthClick={handleMonthClick}
            events={NO_EVENTS}
            onDayClick={agenda.openForDay}
            {...YEAR_DAY_PROPS}
        />
    );
};