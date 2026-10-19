import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { startOfWeekSunday } from "../utils/dashboardCalendarHelpers";

export const MINI_CALENDAR_DAYS = 7;
// With an odd day count the middle day always belongs to the dominant month (no ties).
const MIDDLE_DAY_OFFSET = Math.floor(MINI_CALENDAR_DAYS / 2);

/** Visible week for the dashboard mini calendar: anchored to Sunday, paged a week at a time. */
export const useMiniCalendarWeek = () => {
    const [startDate, setStartDate] = useState<Date>(() => startOfWeekSunday(new Date()));

    const headerTitle = useMemo(
        () => dayjs(startDate).add(MIDDLE_DAY_OFFSET, "day").format("MMMM YYYY"),
        [startDate]
    );

    const goPrev = () => setStartDate((d) => dayjs(d).subtract(MINI_CALENDAR_DAYS, "day").toDate());
    const goNext = () => setStartDate((d) => dayjs(d).add(MINI_CALENDAR_DAYS, "day").toDate());

    return { startDate, headerTitle, goPrev, goNext };
};