import type { Dayjs } from "dayjs";

const THIRTY_MIN_MS = 30 * 60 * 1000;

export const roundUpToNearest30Min = (time: Dayjs): Dayjs => {
    const msSinceMidnight = time.diff(time.startOf('day'));
    const roundedMs = Math.ceil(msSinceMidnight / THIRTY_MIN_MS) * THIRTY_MIN_MS;
    return time.startOf('day').add(roundedMs, 'millisecond');
};