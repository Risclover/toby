import { useMemo } from "react";
import dayjs from "dayjs";
import { useCalendar } from "@/contexts";
import { useGetAllHouseholdEventsQuery } from "@/store";
import { toDateString, toRangeEvents } from "../utils";
import { addDaysYmd } from "../utils/dashboardCalendarHelpers";

const WINDOW_DAYS = 7; // today + next 6

type ScheduleEventData = ReturnType<typeof toRangeEvents>[number];

export type UpcomingDay = {
    /** "YYYY-MM-DD" */
    ymd: string;
    events: ScheduleEventData[];
};

/** True if the event touches this calendar day. An end exactly at the next midnight doesn't count. */
const overlapsDay = (event: ScheduleEventData, ymd: string): boolean => {
    const dayStart = dayjs(ymd).startOf("day");
    const dayEnd = dayjs(ymd).endOf("day");
    const start = dayjs(event.start);
    const end = dayjs(event.end);

    return start.isBefore(dayEnd) && (end.isAfter(dayStart) || end.isSame(start));
};

/** Every event you can see from today through the next 6 days, grouped by day (days with no events omitted). */
export const useUpcomingAgendaEvents = (householdId: number) => {
    const { events } = useCalendar();
    // Same cached query CalendarProvider uses; only here for its loading flag.
    const { isLoading } = useGetAllHouseholdEventsQuery({ householdId }, { skip: !householdId });

    // Keyed on today's date string so the window rolls over after midnight.
    const todayYmd = toDateString();

    const days = useMemo<UpcomingDay[]>(() => {
        const lastYmd = addDaysYmd(todayYmd, WINDOW_DAYS - 1);
        const expanded = toRangeEvents(events.scheduleEvents, todayYmd, lastYmd);

        return Array.from({ length: WINDOW_DAYS }, (_, i) => addDaysYmd(todayYmd, i))
            .map((ymd) => ({ ymd, events: expanded.filter((event) => overlapsDay(event, ymd)) }))
            .filter((day) => day.events.length > 0);
    }, [events.scheduleEvents, todayYmd]);

    return { days, isLoading };
};