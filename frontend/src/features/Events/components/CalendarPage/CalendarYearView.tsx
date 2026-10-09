import { YearView } from "@mantine/schedule";
import dayjs from "dayjs";
import type { CalendarViewProps, ScheduleEventData } from "../../utils";
import { useCalendar } from "@/contexts";

const DAY_NUMBER_FORMAT = "D";

// A year cell is far too small for per-member color coding, so cells show just the day number
// and a click opens a one-day agenda instead. YearView therefore gets no events.
const NO_EVENTS: ScheduleEventData[] = [];

const renderYearDay = (dateStr: string) => dayjs(dateStr).format(DAY_NUMBER_FORMAT);

export const CalendarYearView = ({ date, onDateChange, onViewChange }: CalendarViewProps) => {
    const { agenda } = useCalendar();

    return (
        <YearView
            date={date}
            onDateChange={onDateChange}
            onViewChange={onViewChange}
            events={NO_EVENTS}
            onDayClick={agenda.openForDay}
            renderDay={renderYearDay}
        />
    );
};