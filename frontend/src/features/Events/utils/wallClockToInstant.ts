import dayjs from "dayjs";

/** Converts a viewer-local wall-clock string ("YYYY-MM-DD HH:mm:ss") into an ISO 8601 instant with offset. */
export const wallClockToInstant = (wallClock: string) => dayjs(wallClock).format();