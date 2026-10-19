import { useMemo } from "react";
import dayjs from "dayjs";
import { expandRecurringEvents } from "@mantine/schedule";
import { useGetHouseholdEventsQuery } from "@/store";
import { addDaysYmd, toWallClockScheduleEvents, YMD_FORMAT, isAllDayValue, type EventPayload } from "../utils";

const WINDOW_DAYS = 7; // today + next 6
const ALL_DAY_LABEL = "All Day";

export type UpcomingRow = {
    key: string;
    title: string;
    dayYmd: string;
    timeLabel: string;
    sortKey: string;
};

const formatWallClockTime = (wallClock: string): string =>
    new Date(wallClock.replace(" ", "T")).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

type Occurrence = ReturnType<typeof expandRecurringEvents>[number];

const buildRows = (occurrences: Occurrence[], windowStartYmd: string, windowEndYmd: string): UpcomingRow[] => {
    const rows: UpcomingRow[] = [];

    for (const occ of occurrences) {
        const isAllDay = isAllDayValue((occ.payload as EventPayload).hasTime);
        const startStr = occ.start as string;
        const endStr = occ.end as string;

        const startDay = startStr.slice(0, 10);
        // All-day ends are exclusive (next midnight), so step back a day.
        const endDay = isAllDay ? addDaysYmd(endStr.slice(0, 10), -1) : endStr.slice(0, 10);

        if (startDay === endDay) {
            rows.push({
                key: String(occ.id),
                title: occ.title,
                dayYmd: startDay,
                timeLabel: isAllDay ? ALL_DAY_LABEL : `${formatWallClockTime(startStr)} - ${formatWallClockTime(endStr)}`,
                sortKey: startStr,
            });
            continue;
        }

        // Multi-day: one row per day, clipped to what's visible in the window.
        const firstVisible = startDay > windowStartYmd ? startDay : windowStartYmd;
        const lastVisible = endDay < windowEndYmd ? endDay : windowEndYmd;

        for (let day = firstVisible; day <= lastVisible; day = addDaysYmd(day, 1)) {
            let timeLabel = ALL_DAY_LABEL;
            if (!isAllDay && day === startDay) timeLabel = `Begins ${formatWallClockTime(startStr)}`;
            else if (!isAllDay && day === endDay) timeLabel = `Ends ${formatWallClockTime(endStr)}`;

            rows.push({
                key: `${occ.id}__${day}`,
                title: occ.title,
                dayYmd: day,
                timeLabel,
                sortKey: `${day} ${day === startDay ? startStr.slice(11) : "00:00:00"}`,
            });
        }
    }

    return rows.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
};

/** Rows for the "upcoming this week" list: today + next 6 days, recurring events expanded. */
export const useUpcomingRows = (householdId: number) => {
    const window = useMemo(() => {
        const start = dayjs().startOf("day");
        // Calendar-day math (not +144h) so a DST change inside the window can't shift the end day.
        const end = start.add(WINDOW_DAYS - 1, "day").endOf("day");
        return {
            startIso: start.toISOString(),
            endIso: end.toISOString(),
            startYmd: start.format(YMD_FORMAT),
            endYmd: end.format(YMD_FORMAT),
        };
    }, []);

    const { data: weekEvents, isLoading } = useGetHouseholdEventsQuery(
        { householdId, startIso: window.startIso, endIso: window.endIso },
        { skip: !householdId }
    );

    const rows = useMemo(() => {
        const occurrences = expandRecurringEvents({
            events: toWallClockScheduleEvents(weekEvents ?? []),
            rangeStart: `${window.startYmd} 00:00:00`,
            rangeEnd: `${window.endYmd} 23:59:59`,
        });
        return buildRows(occurrences, window.startYmd, window.endYmd);
    }, [weekEvents, window]);

    return { rows, isLoading };
};