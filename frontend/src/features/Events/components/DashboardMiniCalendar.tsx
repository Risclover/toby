import { useMemo, useState } from "react";
import { Group, Paper, Text, Indicator, UnstyledButton } from "@mantine/core";
import dayjs from "dayjs";
import { useGetAllHouseholdEventsQuery, useGetHouseholdEventsQuery } from "@/store/eventSlice";
import { QuickAddEvent } from "./QuickAddEvent";
import { MiniCalendar } from "@mantine/dates";
import "../styles/QuickAddEvent.css"; // or a global index.css


const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

function ymdFromDateInTz(d: Date, tz = userTz) {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
    const y = parts.find(p => p.type === "year")!.value;
    const m = parts.find(p => p.type === "month")!.value;
    const da = parts.find(p => p.type === "day")!.value;
    return `${y}-${m}-${da}`;
}
function dateFromYmd(ymd: string) {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}
function localMidnight(d: Date, tz = userTz) {
    const ymd = ymdFromDateInTz(d, tz).split("-").map(Number);
    return new Date(ymd[0], ymd[1] - 1, ymd[2], 0, 0, 0, 0);
}

function expandSpanToLocalDays(startIso: string, endIso: string, tz = userTz): string[] {
    // inclusive per local day
    const startDay = localMidnight(new Date(startIso), tz);
    const endDay = localMidnight(new Date(new Date(endIso).getTime() - 1), tz);
    const out: string[] = [];
    for (let cur = startDay; cur <= endDay; cur = new Date(cur.getTime() + 86400000)) {
        out.push(ymdFromDateInTz(cur, tz));
    }
    return out;
}


export function WeekStrip({ householdId }: { householdId: number }) {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [open, setOpen] = useState(false);
    const [viewYmd, setViewYmd] = useState(dayjs().format("YYYY-MM-DD"));
    const [valueYmd, setValueYmd] = useState<string | null>(null);
    const { data: allEvents = [], isLoading: loading } = useGetAllHouseholdEventsQuery({ householdId }, { skip: !householdId });
    const daysWithEvents = useMemo(() => {
        const set = new Set<string>();
        for (const e of allEvents) {
            if (!e.startUtc || !e.endUtc) continue; // unscheduled → no dot on a specific date
            for (const key of expandSpanToLocalDays(e.startUtc, e.endUtc)) set.add(key);
        }
        return set;
    }, [allEvents]);
    // rolling range: today .. today+6

    const handleCalendarClick = (ymd: string) => {
        setSelectedDate(dateFromYmd(ymd));  // <-- now a real Date
        setOpen(true);
    };

    console.log('allEvents', allEvents.length, allEvents);

    return (
        <>
            <MiniCalendar
                numberOfDays={7}
                onChange={handleCalendarClick}
                getDayProps={(ymd /* string YYYY-MM-DD */) => {
                    const isToday = ymd === dayjs().format("YYYY-MM-DD");
                    const has = daysWithEvents.has(ymd);
                    return {
                        className: has ? "mc-has-events" : undefined,
                        style: { color: isToday ? "var(--mantine-color-cyan-3)" : undefined },
                        title: has ? "Has events" : undefined,
                    };
                }}
                styles={{
                    control: { color: "white" }
                }}

            />
            <QuickAddEvent
                householdId={householdId}
                opened={open}
                initialDate={selectedDate}
                onClose={() => setOpen(false)}
            />
        </>
    );
}
