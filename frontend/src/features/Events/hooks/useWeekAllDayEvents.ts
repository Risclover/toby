import { useMemo } from "react";
import dayjs from "dayjs";
import { expandRecurringEvents } from "@mantine/schedule";
import { isAllDayRowEvent, packAllDayLanes, type ScheduleEventData, type AllDayLaneItem } from "../utils/weekAllDayLayout";

const MAX_VISIBLE_LANES = 3;

export interface WeekAllDayOverflow {
    dayCol: number;
    events: ScheduleEventData[];
}

export interface UseWeekAllDayEventsResult {
    visibleLanes: AllDayLaneItem[];
    laneCount: number;
    overflowByDay: WeekAllDayOverflow[];
}

/**
 * Splits a week's events into "belongs in the all-day strip" (all-day
 * events, plus any event -- timed or not -- spanning more than one
 * calendar day) and lays them out into non-overlapping lanes for
 * <WeekAllDayRow />. Recurring series are expanded via
 * `expandRecurringEvents` scoped to just the visible week first, so a
 * recurring all-day event (a weekly holiday, say) still shows up here.
 *
 * Lanes beyond MAX_VISIBLE_LANES are dropped from the rendered grid and
 * folded into a per-day overflow list instead, so a day with a lot of
 * all-day events gets a "+N more" rather than an ever-taller row -- the
 * same trade-off Month view already makes via `maxEventsPerDay`.
 */
export function useWeekAllDayEvents(events: ScheduleEventData[], weekStartDate: string): UseWeekAllDayEventsResult {
    return useMemo(() => {
        const weekStart = dayjs(weekStartDate).startOf("day");
        const weekEnd = weekStart.add(6, "day").endOf("day");

        const candidates = events.filter(isAllDayRowEvent);
        const expanded = expandRecurringEvents({
            events: candidates,
            rangeStart: weekStart.format("YYYY-MM-DD HH:mm:ss"),
            rangeEnd: weekEnd.format("YYYY-MM-DD HH:mm:ss"),
        }) as ScheduleEventData[];

        const lanes = packAllDayLanes(expanded, weekStart);

        const visibleLanes = lanes.filter((item) => item.lane < MAX_VISIBLE_LANES);
        const overflowLanes = lanes.filter((item) => item.lane >= MAX_VISIBLE_LANES);

        const overflowByDay = new Map<number, ScheduleEventData[]>();
        for (const item of overflowLanes) {
            for (let col = item.startCol; col < item.startCol + item.span; col++) {
                overflowByDay.set(col, [...(overflowByDay.get(col) ?? []), item.event]);
            }
        }

        const laneCount = Math.min(
            MAX_VISIBLE_LANES,
            lanes.reduce((max, item) => Math.max(max, item.lane + 1), 0)
        );

        return {
            visibleLanes,
            laneCount,
            overflowByDay: Array.from(overflowByDay.entries()).map(([dayCol, dayEvents]) => ({
                dayCol,
                events: dayEvents,
            })),
        };
    }, [events, weekStartDate]);
}