import dayjs from "dayjs";
import { DATE_FORMAT, TIME_FORMAT } from "./calendarConstants";

export type EventFormSeed =
    | { type: "timeRange"; start: string; end: string }
    | { type: "dayRange"; start: string; end: string }
    | { type: "allDay"; date: string };

export type EventFormSeedProps = {
    initialDate: Date;
    initialEndDate?: string;
    initialStartTime?: string;
    initialEndTime?: string;
};

type GetEventFormSeedPropsProps = {
    seed: EventFormSeed | null;
    fallbackDate: string;
};

/**
 * Only a timeRange (Day/Week slot) seeds times. A dayRange (Month drag) is whole days,
 * so it must stay all-day: EventForm defaults to all-day when no times are passed.
 */
export const getEventFormSeedProps = ({ seed, fallbackDate }: GetEventFormSeedPropsProps): EventFormSeedProps => {
    switch (seed?.type) {
        case "timeRange":
            return {
                initialDate: dayjs(seed.start).toDate(),
                initialEndDate: dayjs(seed.end).format(DATE_FORMAT),
                initialStartTime: dayjs(seed.start).format(TIME_FORMAT),
                initialEndTime: dayjs(seed.end).format(TIME_FORMAT),
            };
        case "dayRange":
            return {
                initialDate: dayjs(seed.start).toDate(),
                initialEndDate: dayjs(seed.end).format(DATE_FORMAT),
            };
        case "allDay":
            return { initialDate: dayjs(seed.date).toDate() };
        default:
            return { initialDate: dayjs(fallbackDate).toDate() };
    }
};