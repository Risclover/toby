import { useMemo } from "react";
import { useCalendar } from "@/contexts";
import { toMobileMonthDayDots } from "../utils";
import { addDaysYmd, toYmd } from "../utils/dashboardCalendarHelpers";

type Params = {
    startDate: Date;
    numberOfDays: number;
};

/** "YYYY-MM-DD" -> one dot color per distinct person with an event that day, for the visible strip. */
export const useMiniCalendarDots = ({ startDate, numberOfDays }: Params): Record<string, string[]> => {
    const { events } = useCalendar();

    return useMemo(() => {
        const firstDay = toYmd(startDate);
        return toMobileMonthDayDots(events.scheduleEvents, firstDay, addDaysYmd(firstDay, numberOfDays - 1));
    }, [events.scheduleEvents, startDate, numberOfDays]);
};