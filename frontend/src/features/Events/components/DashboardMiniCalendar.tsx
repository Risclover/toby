import React, { useMemo, useState, type SetStateAction } from "react";
import { Flex, Group, Stack, Text, useModalsStack } from "@mantine/core";
import dayjs from "dayjs";
import { useGetAllHouseholdEventsQuery } from "@/store/eventSlice";
import { EventForm } from "./EventForm/EventForm";
import { MiniCalendar } from "@mantine/dates";
import "../styles/QuickAddEvent.css"; // or a global index.css
import "../styles/DashboardMiniCalendar.css";
import { useAuthenticateQuery } from "@/store";

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

const MAX_DOTS = 4;

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
    const stack = useModalsStack(['recurrence', 'event-form'])
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

    console.log('DAYS WITH EVENTS:', allEvents);
    const { data: user } = useAuthenticateQuery();
    const dayDots = useMemo(() => {
        const byDay = new Map<string, Map<number, string>>(); // ymd -> (userId -> color)

        const addColor = (ymd: string, userId: number, color?: string | null) => {
            if (!color) return;
            let userColors = byDay.get(ymd);
            if (!userColors) byDay.set(ymd, (userColors = new Map()));
            if (!userColors.has(userId)) userColors.set(userId, color);
        };

        for (const e of allEvents) {
            if (!e.startUtc || !e.endUtc) continue;
            const days = expandSpanToLocalDays(e.startUtc, e.endUtc);
            if (e.visibility === "public") {
                for (const ymd of days) {
                    for (const attendee of e.attendees ?? []) {
                        addColor(ymd, attendee.id, attendee.color);
                    }
                }

            } else if (e.visibility === "private" && user) {
                const isMe = e.creatorId === user.id || (e.attendees ?? []).some((a) => a.id === user.id);
                if (isMe) {
                    for (const ymd of days) addColor(ymd, user.id, user.color);
                }
            }
        }

        const out = new Map<string, string[]>();
        byDay.forEach((userColors, ymd) => out.set(ymd, Array.from(userColors.values())));
        return out;
    }, [allEvents, user]);



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
                <Text fw={500} fz="lg" className="events-header-title">{headerTitle}</Text>
            </Group>

            <MiniCalendar
                styles={{
                    root: {
                        color: "black",
                        fontSize: "var(--text-base)"
                    },
                    days: {
                        gap: "0.25rem"
                    }

                }}
                date={startDate}
                numberOfDays={numberOfDays}
                monthLabelFormat="ddd" // Sun, Mon, Tue, ...
                onPrevious={goPrev}    // keep header in sync with built-in arrows
                onNext={goNext}
                // Do NOT use onChange/onDateChange for opening the modal (arrows trigger them).
                getDayProps={(ymd) => {
                    const isToday = ymd === dayjs().format("YYYY-MM-DD");
                    const colors = (dayDots.get(ymd) ?? []).slice(0, MAX_DOTS);
                    const has = colors.length > 0;

                    const dotVars: Record<string, string | number> = { "--dot-count": colors.length };
                    colors.forEach((color, i) => (dotVars[`--dot-color-${i + 1}`] = color));

                    return {
                        "data-testid": `cal-day-${ymd}`,
                        "data-has-events": has,
                        className: has ? "mc-has-events" : "mc-no-events",
                        style: { background: isToday ? "#f1f1ff" : undefined, ...dotVars },
                        title: has ? "Has events" : undefined,
                        onClick: () => {
                            setSelectedDate(dateFromYmd(ymd));
                            setShowAddEvent(true);
                            stack.open("event-form");
                        },
                    };
                }}
            />
            <EventForm
                householdId={householdId}
                opened={showAddEvent}
                initialDate={selectedDate}
                onClose={() => setShowAddEvent(false)}
                edit={false}
                stack={stack}
            />
        </div>
    );
}
