import { useState } from "react";
import dayjs from "dayjs";
import { toDateString } from "../utils";

type UseMobileMonthViewProps = {
    date: string;
    onDateChange: (date: string) => void;
};

/** Today if it falls in the shown month, otherwise the 1st, so the selected day always exists in view. */
const resolveSelectedDate = (monthDate: string) => {
    const today = dayjs();
    return today.isSame(dayjs(monthDate), "month")
        ? toDateString(today)
        : toDateString(dayjs(monthDate).startOf("month"));
};

export const useMobileMonthView = ({ date, onDateChange }: UseMobileMonthViewProps) => {
    const [selectedDate, setSelectedDate] = useState(() => toDateString());

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

    return { selectedDate, setSelectedDate, stepMonth, selectMonth, goToCurrentMonth };
};