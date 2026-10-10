import { useState } from "react";
import dayjs from "dayjs";
import {
    getDateRange,
    toDateString,

    type ScheduleEventData,
} from "../utils";
import { toMobileMonthDayDots, toMobileMonthEvents } from "../utils/mobileMonthEvents";
import { toMemberColorStripe } from "../utils/memberColorStripe";

type UseCalendarMobileMonthViewProps = {
    date: string;
    onDateChange: (date: string) => void;
    scheduleEvents: ScheduleEventData[];
};

/** Today if it falls in the shown month, otherwise the 1st, so the selected day always exists in view. */
const resolveSelectedDate = (monthDate: string) => {
    const today = dayjs();
    return today.isSame(dayjs(monthDate), "month")
        ? toDateString(today)
        : toDateString(dayjs(monthDate).startOf("month"));
};

export const useCalendarMobileMonthView = ({
    date,
    onDateChange,
    scheduleEvents,
}: UseCalendarMobileMonthViewProps) => {
    const [selectedDate, setSelectedDate] = useState(() => toDateString());

    // `events` feeds the list under the grid (one row per real event); `dayDots` feeds the
    // day-cell color stripe (one mark per distinct person per day). They intentionally differ.
    const { start, end } = getDateRange(date, "monthGrid");
    const events = toMobileMonthEvents(scheduleEvents, start, end);
    const dayDots = toMobileMonthDayDots(scheduleEvents, start, end);

    const getDayProps = (dayDate: string) => {
        const style = toMemberColorStripe(dayDots[dayDate] ?? []);
        return style ? { style } : {};
    };

    const showMonth = (monthDate: string) => {
        onDateChange(monthDate);
        setSelectedDate(resolveSelectedDate(monthDate));
    };

    const stepMonth = (direction: 1 | -1) =>
        showMonth(toDateString(dayjs(date).add(direction, "month")));

    const selectMonth = (value: string | null) => {
        if (value) showMonth(value);
    };

    const goToCurrentMonth = () => showMonth(toDateString());

    return {
        selectedDate,
        setSelectedDate,
        events,
        getDayProps,
        navigation: { stepMonth, selectMonth, goToCurrentMonth },
    };
};