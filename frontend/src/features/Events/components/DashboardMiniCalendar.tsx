import React, { useMemo, useState, type SetStateAction } from "react";
import { Flex, Group, Modal, Stack, Text, useModalsStack } from "@mantine/core";
import dayjs from "dayjs";
import { expandRecurringEvents } from "@mantine/schedule";
import { useGetAllHouseholdEventsQuery, type CalendarEvent } from "@/store/eventSlice";
import { EventForm } from "./EventForm/EventForm";
import { MiniCalendar } from "@mantine/dates";
import "../styles/QuickAddEvent.css"; // or a global index.css
import "../styles/DashboardMiniCalendar.css";
import { useAuthenticateQuery, type User } from "@/store";
import { useHousehold } from "@/hooks";
import { DayEventsModal } from "./EventsModal/DayEventsModal";
import type { ModalId } from "../types";

function toWallClock(isoWithOffset: string) {
    return isoWithOffset.slice(0, 19).replace("T", " ");
}

// expandRecurringEvents' occurrence type allows start/end to be a Date;
// at runtime they're always the wall-clock strings we passed in via
// scheduleEvents, but normalize defensively either way.
function toWallClockString(value: string | Date): string {
    if (typeof value === "string") return value;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
}

// occ.start/occ.end from expandRecurringEvents are "YYYY-MM-DD HH:mm:ss" wall-clock
// strings already in the viewer's local time — split into the local calendar day(s)
// the occurrence actually spans. Mirrors the old expandSpanToLocalDays, but works
// directly off wall-clock strings instead of re-parsing through Date/timezone math.
function expandWallClockSpanToDays(startWallClock: string, endWallClock: string): string[] {
    const startDay = startWallClock.slice(0, 10);
    // treat an end landing exactly on midnight as "ends at the close of the previous day"
    const endDay = endWallClock.slice(11) === "00:00:00"
        ? dayjs(endWallClock.slice(0, 10)).subtract(1, "day").format("YYYY-MM-DD")
        : endWallClock.slice(0, 10);

    const out: string[] = [];
    let cur = dayjs(startDay);
    const last = dayjs(endDay);
    while (cur.isBefore(last) || cur.isSame(last, "day")) {
        out.push(cur.format("YYYY-MM-DD"));
        cur = cur.add(1, "day");
    }
    return out;
}

function dateFromYmd(ymd: string) {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
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

const MAX_DOTS = 8;

type NavigableScreen = Exclude<ModalId, 'recurrence'>;

type Props = {
    householdId: number;
    showAddEvent: boolean;
    setShowAddEvent: React.Dispatch<SetStateAction<boolean>>;
}
export function DashboardMiniCalendar({
    householdId,
    showAddEvent,
    setShowAddEvent,
}: Props) {
    const numberOfDays = 7;
    const stack = useModalsStack(['events-list', 'recurrence', 'event-form'])
    // start of the visible 7-day strip — anchored to Sunday
    const [startDate, setStartDate] = useState<Date>(() => startOfWeekSunday(new Date()));
    // date to seed QuickAddEvent
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const { data: allEvents = [] } = useGetAllHouseholdEventsQuery(
        { householdId },
        { skip: !householdId }
    );
    const { data: user } = useAuthenticateQuery();

    const scheduleEvents = useMemo(
        () =>
            allEvents
                .filter((e) => e.startUtc && e.endUtc)
                .map((e) => {
                    const payload = { source: e };

                    if (e.rrule) {
                        return {
                            id: e.id,
                            title: e.title,
                            start: toWallClock(e.startUtc),
                            end: toWallClock(e.endUtc),
                            color: "gray",
                            recurrence: { rrule: e.rrule, exdate: e.exdate },
                            payload,
                        };
                    }

                    return {
                        id: e.id,
                        title: e.title,
                        start: toWallClock(e.startUtc),
                        end: toWallClock(e.endUtc),
                        color: "gray",
                        payload,
                    };
                }),
        [allEvents]
    );

    const dayDots = useMemo(() => {
        const byDay = new Map<string, Map<number, string>>(); // ymd -> (userId -> color)

        const addColor = (ymd: string, userId: number, color?: string | null) => {
            if (!color) return;
            let userColors = byDay.get(ymd);
            if (!userColors) byDay.set(ymd, (userColors = new Map()));
            if (!userColors.has(userId)) userColors.set(userId, color);
        };

        const windowStart = `${dayjs(startDate).format("YYYY-MM-DD")} 00:00:00`;
        const windowEnd = `${dayjs(startDate).add(numberOfDays - 1, "day").format("YYYY-MM-DD")} 23:59:59`;

        // expandRecurringEvents can return occurrences that spill outside the
        // requested range for recurring events (confirmed while debugging the
        // events-list modal double-listing bug) — re-check actual overlap
        // ourselves rather than trusting its range filtering.
        const occurrences = expandRecurringEvents({
            events: scheduleEvents,
            rangeStart: windowStart,
            rangeEnd: windowEnd,
        })
            .map((occ) => ({
                ...occ,
                start: toWallClockString(occ.start),
                end: toWallClockString(occ.end),
            }))
            .filter((occ) => occ.start <= windowEnd && occ.end > windowStart);

        for (const occ of occurrences) {
            const event = occ.payload?.source;
            const days = expandWallClockSpanToDays(occ.start, occ.end);

            if (event.visibility === "public") {
                for (const ymd of days) {
                    for (const attendee of event.attendees ?? []) {
                        addColor(ymd, attendee.id, attendee.color);
                    }
                }
            } else if (event.visibility === "private" && user) {
                const isMe = event.creatorId === user.id || (event.attendees ?? []).some((a: User) => a.id === user.id);
                if (isMe) {
                    for (const ymd of days) addColor(ymd, user.id, user.color);
                }
            }
        }

        const out = new Map<string, string[]>();
        byDay.forEach((userColors, ymd) => out.set(ymd, Array.from(userColors.values())));
        return out;
    }, [scheduleEvents, user, startDate, numberOfDays]);



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

    const navigateTo = (screen: NavigableScreen, eventToEdit?: CalendarEvent) => {
        setEditingEvent(eventToEdit);
        setShowAddEvent(screen === 'event-form');
        stack.close(screen === 'event-form' ? 'events-list' : 'event-form');
        stack.open(screen);
    };

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
                    const allColors = dayDots.get(ymd) ?? [];
                    const hasOverflow = allColors.length > MAX_DOTS;
                    const colors = hasOverflow ? allColors.slice(0, MAX_DOTS - 1) : allColors.slice(0, MAX_DOTS);
                    const overflowCount = allColors.length - colors.length;
                    const has = colors.length > 0 || hasOverflow;

                    const dotVars: Record<string, string | number> = { "--dot-count": colors.length };
                    colors.forEach((color, i) => {
                        const n = i + 1;
                        dotVars[`--dot-color-${n}`] = color;
                        if (n > 1) dotVars[`--dot-ring-${n}`] = "#fff"; // match your day-cell background
                    });

                    return {
                        "data-testid": `cal-day-${ymd}`,
                        "data-has-events": has,
                        ...(hasOverflow ? { "data-overflow": `+${overflowCount}` } : {}),
                        className: has ? "mc-has-events" : "mc-no-events",
                        style: { background: isToday ? "#f1f1ff" : undefined, ...dotVars },
                        title: has ? "Has events" : undefined,
                        onClick: () => {
                            setSelectedDate(dateFromYmd(ymd));
                            stack.open("events-list");
                        },
                    };
                }}
            />
            <DayEventsModal
                householdId={householdId}
                date={selectedDate}
                setSelectedDate={setSelectedDate}
                stack={stack}
                onAddEvent={() => navigateTo('event-form')}
                onEditEvent={(event) => navigateTo('event-form', event)}
            />
            <EventForm
                householdId={householdId}
                opened={showAddEvent}
                initialDate={selectedDate}
                onClose={() => navigateTo('events-list')}
                edit={Boolean(editingEvent)}
                event={editingEvent}
                stack={stack}
            />
        </div>
    );
}