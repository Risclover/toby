import dayjs from "dayjs";

export const YMD_FORMAT = "YYYY-MM-DD";
const MAX_DOTS = 8;
const DOT_RING_COLOR = "#fff"; // matches the day-cell background

export const toYmd = (date: Date): string => dayjs(date).format(YMD_FORMAT);

export const addDaysYmd = (ymd: string, days: number): string =>
    dayjs(ymd).add(days, "day").format(YMD_FORMAT);

/** Sunday (00:00 local) of the week containing `date`. */
export const startOfWeekSunday = (date: Date): Date =>
    dayjs(date).subtract(dayjs(date).day(), "day").startOf("day").toDate();

/** "Tuesday, October 27" (year appended only when it isn't the current year). */
export const formatDayLabel = (ymd: string): string => {
    const day = dayjs(ymd);
    return day.format(day.year() === dayjs().year() ? "dddd, MMMM D" : "dddd, MMMM D, YYYY");
};

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