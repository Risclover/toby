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

    const occurrences = useMemo(
        () =>
            expandRecurringEvents({
                events: scheduleEvents,
                rangeStart: `${dateStr} 00:00:00`,
                rangeEnd: `${dateStr} 23:59:59`,
            }),
        [scheduleEvents, dateStr]
    );

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