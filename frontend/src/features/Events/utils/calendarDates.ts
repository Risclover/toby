import dayjs, { type ConfigType, type Dayjs } from "dayjs";
import { DATE_FORMAT } from "./calendarConstants";

/** "monthGrid" pads to full calendar weeks, matching the leading/trailing days a month grid renders. */
const RANGE_BOUNDS = {
    day: {
        start: (date) => date,
        end: (date) => date,
    },
    week: {
        start: (date) => date.startOf("week"),
        end: (date) => date.endOf("week"),
    },
    month: {
        start: (date) => date.startOf("month"),
        end: (date) => date.endOf("month"),
    },
    monthGrid: {
        start: (date) => date.startOf("month").startOf("week"),
        end: (date) => date.endOf("month").endOf("week"),
    },
} satisfies Record<string, { start: (date: Dayjs) => Dayjs; end: (date: Dayjs) => Dayjs }>;

export type RangeScope = keyof typeof RANGE_BOUNDS;

export type DateRange = {
    start: string;
    end: string;
};

export const toDateString = (value?: ConfigType): string => dayjs(value).format(DATE_FORMAT);

export const getDateRange = (date: ConfigType, scope: RangeScope): DateRange => {
    const anchor = dayjs(date);
    const { start, end } = RANGE_BOUNDS[scope];

    return {
        start: toDateString(start(anchor)),
        end: toDateString(end(anchor)),
    };
};