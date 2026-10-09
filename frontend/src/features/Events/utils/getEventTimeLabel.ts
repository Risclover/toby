import dayjs, { type ConfigType } from "dayjs";
import { formatEventDate, formatEventDateTime } from "./formatEventDate";

const ALL_DAY_LABEL = "All day";
const RANGE_SEPARATOR = " – ";
const DISPLAY_TIME_FORMAT = "h:mma";

type EventTimeLabelProps = {
    start: ConfigType;
    end: ConfigType;
    hasTime: boolean;
};

const joinRange = (from: string, to: string) => `${from}${RANGE_SEPARATOR}${to}`;

export const getEventTimeLabel = ({ start, end, hasTime }: EventTimeLabelProps): string => {
    const startDay = dayjs(start);
    const endDay = dayjs(end);
    const isMultiDay = !startDay.isSame(endDay, "day");

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