import dayjs from "dayjs";


export function currentWeekRange(today = new Date(), weekStartsOnSunday = true) {
    const d = dayjs(today);
    const dow = d.day(); // 0=Sun..6=Sat
    const start = weekStartsOnSunday ? d.startOf("week") : d.startOf("week").add(1, "day");
    const end = start.add(6, "day").endOf("day");
    return { startIso: start.toDate().toISOString(), endIso: end.toDate().toISOString(), start: start.toDate(), end: end.toDate() };
}


export function formatTimeLocal(iso: string) {
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}