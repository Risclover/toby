import dayjs from "dayjs";
import type { CalendarEvent } from "@/store";
import { apiEventToScheduleEvent } from "./eventsTransform";

export const YMD_FORMAT = "YYYY-MM-DD";
const WALL_CLOCK_FORMAT = "YYYY-MM-DD HH:mm:ss";
const MAX_DOTS = 8;
const DOT_RING_COLOR = "#fff"; // matches the day-cell background

/** expandRecurringEvents types start/end as string | Date; normalize to a wall-clock string. */
export const normalizeWallClock = (value: string | Date): string =>
    typeof value === "string" ? value : dayjs(value).format(WALL_CLOCK_FORMAT);

export const toYmd = (date: Date): string => dayjs(date).format(YMD_FORMAT);

export const dateFromYmd = (ymd: string): Date => dayjs(ymd).toDate();

export const addDaysYmd = (ymd: string, days: number): string =>
    dayjs(ymd).add(days, "day").format(YMD_FORMAT);

/** Sunday (00:00 local) of the week containing `date`. */
export const startOfWeekSunday = (date: Date): Date =>
    dayjs(date).subtract(dayjs(date).day(), "day").startOf("day").toDate();

/**
 * Local calendar days ("YYYY-MM-DD") an occurrence touches, from its wall-clock
 * start/end. An end landing exactly on midnight belongs to the previous day.
 */
export const expandWallClockSpanToDays = (startWallClock: string, endWallClock: string): string[] => {
    const startDay = startWallClock.slice(0, 10);
    const endsAtMidnight = endWallClock.slice(11) === "00:00:00";
    const rawEndDay = endsAtMidnight
        ? addDaysYmd(endWallClock.slice(0, 10), -1)
        : endWallClock.slice(0, 10);
    // A zero-length event at midnight would otherwise end before it starts.
    const endDay = rawEndDay < startDay ? startDay : rawEndDay;

    const days: string[] = [];
    for (let day = startDay; day <= endDay; day = addDaysYmd(day, 1)) days.push(day);
    return days;
};

/** Events -> the wall-clock shape expandRecurringEvents expects. Drops events missing a boundary. */
export const toWallClockScheduleEvents = (events: CalendarEvent[]) =>
    events.filter((e) => e.startUtc && e.endUtc).map(apiEventToScheduleEvent);

/** Dot count, overflow badge and CSS vars for one day cell of the mini calendar. */
export const getDayDots = (allColors: string[]) => {
    const hasOverflow = allColors.length > MAX_DOTS;
    // Reserve the last slot for the "+N" badge when there's overflow.
    const colors = hasOverflow ? allColors.slice(0, MAX_DOTS - 1) : allColors;

    const cssVars: Record<string, string | number> = { "--dot-count": colors.length };
    colors.forEach((color, i) => {
        const n = i + 1;
        cssVars[`--dot-color-${n}`] = color;
        if (n > 1) cssVars[`--dot-ring-${n}`] = DOT_RING_COLOR;
    });

    return {
        hasDots: colors.length > 0,
        overflowCount: allColors.length - colors.length,
        hasOverflow,
        cssVars,
    };
};

export const formatDayLabel = (ymd: string): string => {
    const day = dayjs(ymd);
    return day.format(day.year() === dayjs().year() ? "dddd, MMMM D" : "dddd, MMMM D, YYYY");
};