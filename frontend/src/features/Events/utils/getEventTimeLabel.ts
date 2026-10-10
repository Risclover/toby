import dayjs, { type ConfigType } from "dayjs";
import { formatEventDate, formatEventDateTime } from "./formatEventDate";

const ALL_DAY_LABEL = "All day";
const RANGE_SEPARATOR = " – ";
const DETAILS_SEPARATOR = " · ";
const DISPLAY_TIME_FORMAT = "h:mma";

type EventTimeLabelProps = {
    start: ConfigType;
    end: ConfigType;
    hasTime: boolean;
};

const joinRange = (from: string, to: string) => `${from}${RANGE_SEPARATOR}${to}`;

const spansMultipleDays = (start: ConfigType, end: ConfigType) =>
    !dayjs(start).isSame(dayjs(end), "day");

export const getEventTimeLabel = ({ start, end, hasTime }: EventTimeLabelProps): string => {
    const startDay = dayjs(start);
    const endDay = dayjs(end);
    const isMultiDay = spansMultipleDays(start, end);

    if (!hasTime) {
        return isMultiDay
            ? joinRange(formatEventDate(startDay), formatEventDate(endDay))
            : ALL_DAY_LABEL;
    }

    if (isMultiDay) {
        return joinRange(formatEventDateTime(startDay), formatEventDateTime(endDay));
    }

    return joinRange(startDay.format(DISPLAY_TIME_FORMAT), endDay.format(DISPLAY_TIME_FORMAT));
};

/** Same as getEventTimeLabel, but always names the date: "Oct 9 · 2:00pm – 3:00pm". */
export const getEventDetailsTimeLabel = (props: EventTimeLabelProps): string => {
    const { start, end, hasTime } = props;
    const label = getEventTimeLabel(props);

    if (spansMultipleDays(start, end)) {
        return hasTime ? label : `${label}${DETAILS_SEPARATOR}${ALL_DAY_LABEL}`;
    }

    return `${formatEventDate(dayjs(start))}${DETAILS_SEPARATOR}${label}`;
};