import dayjs from "dayjs";

const needsYear = (date: dayjs.Dayjs) => dayjs().year() !== date.year();

/** "MMM D" or "MMM D, YYYY" if the year differs from the current year. */
export function formatEventDate(value: string | Date | dayjs.Dayjs): string {
    const date = dayjs(value);
    return date.format(needsYear(date) ? "MMM D, YYYY" : "MMM D");
}

/** "MMM D, h:mma" or "MMM D, YYYY, h:mma" if the year differs. */
export function formatEventDateTime(value: string | Date | dayjs.Dayjs): string {
    const date = dayjs(value);
    return date.format(needsYear(date) ? "MMM D, YYYY, h:mma" : "MMM D, h:mma");
}

/** Full month name, for the agenda modal's header: "September 17" or "September 17, 2026". */
export function formatAgendaHeaderDate(value: string | Date | dayjs.Dayjs): string {
    const date = dayjs(value);
    return date.format(needsYear(date) ? "MMMM D, YYYY" : "MMMM D");
}