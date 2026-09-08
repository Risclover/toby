import { useMemo, useState } from "react";
import dayjs from "dayjs";
import type { useModalsStack } from "@mantine/core";
import { expandRecurringEvents } from "@mantine/schedule";
import { useIsSmallScreen } from "@/hooks";
import { useGetHouseholdEventsForDayQuery } from "@/store";

const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

function toWallClock(isoWithOffset: string) {
    return isoWithOffset.slice(0, 19).replace("T", " ");
}

type Props = {
    householdId: number;
    date: Date;
    onDateChange?: (date: Date) => void;
    stack?: ReturnType<typeof useModalsStack<'recurrence' | 'event-form' | 'events-list'>> | undefined;
}

{/** Custom hook that handles logic and setup for homepage's events list modal */ }
export function useDayEvents({
    householdId,
    date,
    onDateChange,
    stack
}: Props) {
    const dateStr = dayjs(date).format("YYYY-MM-DD");
    const isSmallScreen = useIsSmallScreen(475);
    const dayEventsStackProps = stack?.register('events-list');
    const [filterValue, setFilterValue] = useState<string | null>(null);
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

    const occurrences = useMemo(() => {
        const dayStart = `${dateStr} 00:00:00`;
        const dayEnd = `${dateStr} 23:59:59`;

        // expandRecurringEvents can return occurrences that spill outside
        // [rangeStart, rangeEnd] for recurring all-day events (seen in practice:
        // querying one day returned that day's occurrence *and* the next day's).
        // Re-check actual overlap with this day ourselves rather than trusting
        // the library's range filtering.
        return expandRecurringEvents({
            events: scheduleEvents,
            rangeStart: dayStart,
            rangeEnd: dayEnd,
        }).filter((occ) => occ.start <= dayEnd && occ.end > dayStart);
    }, [scheduleEvents, dateStr]);

    const handleDateChange = (value: string | null) => {
        if (!value) return;
        if (onDateChange)
            onDateChange(dayjs(value).toDate());
    };
    const goToPreviousDay = () => onDateChange && onDateChange(dayjs(date).subtract(1, 'day').toDate());
    const goToNextDay = () => onDateChange && onDateChange(dayjs(date).add(1, 'day').toDate());

    return {
        isSmallScreen,
        dayEventsStackProps,
        filterValue,
        setFilterValue,
        occurrences,
        isLoading: isLoading || isFetching,
        handleDateChange,
        goToPreviousDay,
        goToNextDay
    };
}