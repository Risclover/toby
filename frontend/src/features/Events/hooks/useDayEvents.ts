import { useMemo } from "react";
import dayjs from "dayjs";
import { expandRecurringEvents } from "@mantine/schedule";
import { useGetHouseholdEventsForDayQuery, type CalendarEvent } from "@/store/eventSlice";

const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

function toWallClock(isoWithOffset: string) {
    return isoWithOffset.slice(0, 19).replace("T", " ");
}

export function useDayEvents(householdId: number, date: Date) {
    const dateStr = dayjs(date).format("YYYY-MM-DD");

    const { data: dayEvents = [], isLoading, isFetching } = useGetHouseholdEventsForDayQuery(
        { householdId, date: dateStr, tzid: userTz },
        { skip: !householdId }
    );

    const scheduleEvents = useMemo(
        () =>
            dayEvents
                .filter((e) => e.startUtc && e.endUtc)
                .map((e) => {
                    const payload = { source: e };

                    // Two distinct return shapes (not a conditionally-spread
                    // `recurrence` field) so TS can infer a real
                    // discriminated union for ScheduleEventData -- same fix
                    // UpcomingThisWeek.tsx already applied for the identical
                    // issue.
                    if (e.rrule) {
                        return {
                            id: e.id,
                            title: e.title,
                            start: toWallClock(e.startUtc),
                            end: toWallClock(e.endUtc),
                            color: "gray",
                            recurrence: { rrule: e.rrule },
                            payload,
                        };
                    }

                    return {
                        id: e.id,
                        title: e.title,
                        start: toWallClock(e.startUtc),
                        end: toWallClock(e.endUtc),
                        color: "gray",
                        payload,
                    };
                }),
        [dayEvents]
    );

    const occurrences = useMemo(
        () =>
            expandRecurringEvents({
                events: scheduleEvents,
                rangeStart: `${dateStr} 00:00:00`,
                rangeEnd: `${dateStr} 23:59:59`,
            }),
        [scheduleEvents, dateStr]
    );

    return { occurrences, isLoading: isLoading || isFetching };
}