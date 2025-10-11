import { useMemo, useState, useEffect } from "react";
import { MiniCalendar } from "@mantine/dates";
import dayjs from "dayjs";
import { useGetHouseholdEventsQuery, calendarApi } from "@/store/eventSlice";

const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Build a local Date (midnight local) from "YYYY-MM-DD" safely
function localMidnightFromYmd(ymd: string) {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0); // local time
}

// Given a visible start ymd and numberOfDays, return ISO range (UTC) for the query
function isoRangeFromView(ymd: string, numberOfDays: number) {
    const startLocal = localMidnightFromYmd(ymd);
    const endLocal = new Date(startLocal);
    endLocal.setDate(endLocal.getDate() + numberOfDays - 1);
    endLocal.setHours(23, 59, 59, 999);
    return { startIso: startLocal.toISOString(), endIso: endLocal.toISOString() };
}

// Increment/decrement a "YYYY-MM-DD" by N days
function shiftYmd(ymd: string, days: number) {
    const d = localMidnightFromYmd(ymd);
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
}

export function WeekStrip({ householdId }: { householdId: number }) {
    const numberOfDays = 7;

    // visible interval start (controls the built-in arrows)
    const [viewYmd, setViewYmd] = useState<string>(dayjs().format("YYYY-MM-DD"));

    // selected day (when the user clicks a day)
    const [valueYmd, setValueYmd] = useState<string | null>(null);

    // fetch window follows the visible week
    const { startIso, endIso } = useMemo(
        () => isoRangeFromView(viewYmd, numberOfDays),
        [viewYmd]
    );

    const args = { householdId, startIso, endIso };
    const { data: events = [] } = useGetHouseholdEventsQuery(args, { skip: !householdId });

    // OPTIONAL: prefetch next/prev weeks so dots feel instant
    const prefetch = calendarApi.usePrefetch("getHouseholdEvents");
    useEffect(() => {
        const nextView = shiftYmd(viewYmd, numberOfDays);
        const prevView = shiftYmd(viewYmd, -numberOfDays);

        const n = isoRangeFromView(nextView, numberOfDays);
        const p = isoRangeFromView(prevView, numberOfDays);

        prefetch({ householdId, ...n });
        prefetch({ householdId, ...p });
    }, [viewYmd, householdId, prefetch]);

    // Build counts keyed by user's local Y-M-D (using Intl to be safe with TZ)
    const counts = useMemo(() => {
        const map: Record<string, number> = {};
        const fmt = new Intl.DateTimeFormat("en-CA", {
            timeZone: userTz,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
        for (const e of events) {
            if (!e.startUtc) continue; // skip unscheduled
            const d = new Date(e.startUtc);
            const parts = fmt.formatToParts(d);
            const y = parts.find(p => p.type === "year")!.value;
            const m = parts.find(p => p.type === "month")!.value;
            const da = parts.find(p => p.type === "day")!.value;
            const key = `${y}-${m}-${da}`;
            map[key] = (map[key] ?? 0) + 1;
        }
        return map;
    }, [events]);

    return (
        <MiniCalendar
            numberOfDays={numberOfDays}

            // CONTROL the visible interval start; built-in arrows will use these:
            date={viewYmd}
            onNext={() => setViewYmd(shiftYmd(viewYmd, numberOfDays))}
            onPrevious={() => setViewYmd(shiftYmd(viewYmd, -numberOfDays))}
            onDateChange={(ymd) => setViewYmd(ymd)} // in case component changes internal start

            // Selected day (when a user clicks a cell)
            value={valueYmd}
            onChange={(ymd) => {
                setValueYmd(ymd);
                // optionally open your QuickAdd here using localMidnightFromYmd(ymd)
            }}

            // Add dots & today highlight — note: getDayProps(date) passes a STRING
            getDayProps={(ymd) => {
                const count = counts[ymd] ?? 0;
                const isToday = ymd === dayjs().format("YYYY-MM-DD");
                return {
                    className: count > 0 ? "mc-has-events" : undefined,
                    title: count ? `${count} event${count > 1 ? "s" : ""}` : undefined,
                    style: { color: isToday ? "var(--mantine-color-cyan-3)" : undefined },
                };
            }}
        />
    );
}
