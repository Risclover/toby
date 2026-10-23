import { useMemo } from "react";
import dayjs from "dayjs";
import { useCalendar } from "@/contexts";
import { useGetAllHouseholdEventsQuery } from "@/store";
import { toDateString, toRangeEvents, type EventColorPayload } from "../utils";
import { YMD_FORMAT } from "../utils/dashboardCalendarHelpers";

const WINDOW_DAYS = 7; // today + next 6
const PRIVATE_VISIBILITY = "private";

/** Everything non-private happening from today through the next 6 days, ready for AgendaView. */
export const useUpcomingAgendaEvents = (householdId: number) => {
    const { events } = useCalendar();
    // Same cached query CalendarProvider uses; only here for its loading flag.
    const { isLoading } = useGetAllHouseholdEventsQuery({ householdId }, { skip: !householdId });

    // Keyed on today's date string so the window rolls over after midnight.
    const todayYmd = toDateString();
    const range = useMemo(
        () => ({ start: todayYmd, end: dayjs(todayYmd).add(WINDOW_DAYS - 1, "day").format(YMD_FORMAT) }),
        [todayYmd]
    );

    const agendaEvents = useMemo(() => {
        const windowStart = dayjs(range.start).startOf("day");
        const windowEnd = dayjs(range.end).endOf("day");

        const publicEvents = events.scheduleEvents.filter(
            (event) => (event.payload as EventColorPayload | undefined)?.visibility !== PRIVATE_VISIBILITY
        );

        // toRangeEvents passes non-recurring events through untouched, whatever
        // their dates, so keep only occurrences that really overlap the window.
        // That also makes "is this list empty?" a reliable question.
        return toRangeEvents(publicEvents, range.start, range.end).filter(
            (event) => !dayjs(event.end).isBefore(windowStart) && !dayjs(event.start).isAfter(windowEnd)
        );
    }, [events.scheduleEvents, range]);

    return { agendaEvents, range, isLoading };
};