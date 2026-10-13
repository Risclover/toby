import dayjs from "dayjs";

type Props = {
    /** Wall-clock start, "YYYY-MM-DD HH:mm:ss" */
    start: string;
    /** Wall-clock end, "YYYY-MM-DD HH:mm:ss" */
    end: string;
    isAllDay: boolean;
};

const TIME_FORMAT = "h:mma";
const DATE_TIME_FORMAT = "MMM D, h:mma";
const DATE_TIME_YEAR_FORMAT = "MMM D, YYYY, h:mma";
const ALL_DAY_LABEL = "All day";
const RANGE_SEPARATOR = " - ";

const formatDateTime = (value: dayjs.Dayjs) =>
    value.format(value.year() === dayjs().year() ? DATE_TIME_FORMAT : DATE_TIME_YEAR_FORMAT);

export const getDayEventTimeLabel = ({ start, end, isAllDay }: Props) => {
    if (isAllDay) return ALL_DAY_LABEL;

    const startTime = dayjs(start);
    const endTime = dayjs(end);

    if (!startTime.isSame(endTime, "day")) {
        return `${formatDateTime(startTime)}${RANGE_SEPARATOR}${formatDateTime(endTime)}`;
    }

    return `${startTime.format(TIME_FORMAT)}${RANGE_SEPARATOR}${endTime.format(TIME_FORMAT)}`;
};