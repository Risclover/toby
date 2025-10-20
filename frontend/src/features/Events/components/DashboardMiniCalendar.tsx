import React, { useMemo, useState, type SetStateAction } from "react";
import { Group, Text } from "@mantine/core";
import dayjs from "dayjs";
import { useGetAllHouseholdEventsQuery } from "@/store/eventSlice";
import { QuickAddEvent } from "./QuickAddEvent";
import { MiniCalendar } from "@mantine/dates";
import "../styles/QuickAddEvent.css"; // or a global index.css
import "../styles/DashboardMiniCalendar.css";

const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

function ymdFromDateInTz(d: Date, tz = userTz) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(d);
    const y = parts.find((p) => p.type === "year")!.value;
    const m = parts.find((p) => p.type === "month")!.value;
    const da = parts.find((p) => p.type === "day")!.value;
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

// Return the Sunday of the week containing `d` (local time).
// JS getDay(): Sunday=0 ... Saturday=6
function startOfWeekSunday(d: Date): Date {
    const js = new Date(d);
    const delta = js.getDay(); // days since Sunday
    js.setDate(js.getDate() - delta);
    js.setHours(0, 0, 0, 0);
    return js;
}

export function DashboardMiniCalendar({
    householdId,
    showAddEvent,
    setShowAddEvent,
}: {
    householdId: number;
    showAddEvent: boolean;
    setShowAddEvent: React.Dispatch<SetStateAction<boolean>>;
}) {
    const numberOfDays = 7;

    // start of the visible 7-day strip — anchored to Sunday
    const [startDate, setStartDate] = useState<Date>(() => startOfWeekSunday(new Date()));
    // date to seed QuickAddEvent
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const { data: allEvents = [] } = useGetAllHouseholdEventsQuery(
        { householdId },
        { skip: !householdId }
    );

    const daysWithEvents = useMemo(() => {
        const set = new Set<string>();
        for (const e of allEvents) {
            if (!e.startUtc || !e.endUtc) continue; // unscheduled → no dot on a specific date
            for (const key of expandSpanToLocalDays(e.startUtc, e.endUtc)) set.add(key);
        }
        return set;
    }, [allEvents]);

    // Dominant-month title for the visible strip (ties favor the month containing startDate/Sunday)
    const headerTitle = useMemo(() => {
        const counts = new Map<string, number>();
        for (let i = 0; i < numberOfDays; i++) {
            const d = dayjs(startDate).add(i, "day");
            const key = d.format("YYYY-MM");
            counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        const startKey = dayjs(startDate).format("YYYY-MM");
        let bestKey = startKey;
        let bestCount = -1;
        counts.forEach((cnt, key) => {
            if (cnt > bestCount || (cnt === bestCount && key === startKey)) {
                bestCount = cnt;
                bestKey = key;
            }
        });
        return dayjs(`${bestKey}-01`).format("MMMM YYYY");
    }, [startDate, numberOfDays]);

    const goPrev = () =>
        setStartDate((d) => dayjs(d).subtract(numberOfDays, "day").toDate()); // stays on Sundays
    const goNext = () =>
        setStartDate((d) => dayjs(d).add(numberOfDays, "day").toDate()); // stays on Sundays

    return (
        <div className="events-calendar">
            {/* Centered dominant-month title; MiniCalendar keeps its own arrows */}
            <Group justify="center" className="events-calendar-header">
                <Text fw={500} fz="lg" c="white">{headerTitle}</Text>
            </Group>

            <MiniCalendar
                date={startDate}
                numberOfDays={numberOfDays}
                monthLabelFormat="ddd" // Sun, Mon, Tue, ...
                onPrevious={goPrev}    // keep header in sync with built-in arrows
                onNext={goNext}
                // Do NOT use onChange/onDateChange for opening the modal (arrows trigger them).
                getDayProps={(ymd /* YYYY-MM-DD */) => {
                    const isToday = ymd === dayjs().format("YYYY-MM-DD");
                    const has = daysWithEvents.has(ymd);
                    return {
                        "data-testid": `cal-day-${ymd}`,
                        "data-has-events": has ? true : false,
                        className: has ? "mc-has-events" : undefined,
                        style: { color: isToday ? "var(--mantine-color-cyan-3)" : undefined },
                        title: has ? "Has events" : undefined,
                        onClick: () => {
                            setSelectedDate(dateFromYmd(ymd));
                            setShowAddEvent(true);
                        },
                    };
                }}
                styles={{
                    control: { color: "white" },
                }}
            />

            <QuickAddEvent
                householdId={householdId}
                opened={showAddEvent}
                initialDate={selectedDate}
                onClose={() => setShowAddEvent(false)}
            />
        </div>
    );
}
