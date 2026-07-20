import type dayjs from "dayjs";

export const RRULE_WEEKDAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
export const ORDINAL_WORDS = ['', 'first', 'second', 'third', 'fourth', 'fifth'];
export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function ordinalOfWeekdayInMonth(date: dayjs.Dayjs): number {
    return Math.ceil(date.date() / 7); // dayjs .date() = day-of-month, 1-31
}

// "3TU" for a Tuesday that's the 3rd Tuesday of its month
export function monthlyByDayValue(date: dayjs.Dayjs): string {
    return `${ordinalOfWeekdayInMonth(date)}${RRULE_WEEKDAY_CODES[date.day()]}`;
}

export function monthlyOnNthWeekdayRule(date: dayjs.Dayjs): string {
    return `FREQ=MONTHLY;BYDAY=${monthlyByDayValue(date)}`;
}

// "Monthly on the third Tuesday" -- for the preset's label text
export function monthlyOnNthWeekdayLabel(date: dayjs.Dayjs): string {
    const ordinal = ordinalOfWeekdayInMonth(date);
    return `Monthly on the ${ORDINAL_WORDS[ordinal]} ${WEEKDAY_NAMES[date.day()]}`;
}