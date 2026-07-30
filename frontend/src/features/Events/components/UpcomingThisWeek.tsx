// src/features/calendar/UpcomingNext7Days.tsx
import { ActionIcon, ActionIconGroup, Anchor, Button, Card, Group, Paper, ScrollArea, Skeleton, Stack, Text } from "@mantine/core";
import { useCallback, useMemo, useState } from "react";
import { useDeleteEventMutation, useGetAllHouseholdEventsQuery, useGetHouseholdEventsQuery, type CalendarEvent } from "@/store/eventSlice";
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import DeleteRounded from '@mui/icons-material/Delete';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import "../styles/UpcomingThisWeek.css"
import { EventForm } from "./EventForm/EventForm";
import { Box } from "lucide-react";
import { EventMenu } from "./EventMenu";
import { useAuthenticateQuery } from "@/store";
import { expandRecurringEvents } from "@mantine/schedule";

/** ymd + n days (n may be negative), as a string. */
function addDaysYmd(day: string, n: number) {
    const d = new Date(`${day}T00:00:00`);
    d.setDate(d.getDate() + n);
    return ymd(d);
}

/** ymd + 1 day, as a string. */
function nextYmd(day: string) {
    return addDaysYmd(day, 1);
}

function startOfToday(d = new Date()) {
    const t = new Date(d);
    t.setHours(0, 0, 0, 0);
    return t;
}
function endOfDay(d: Date) {
    const e = new Date(d);
    e.setHours(23, 59, 59, 999);
    return e;
}
function rangeTodayPlus6() {
    const start = startOfToday(new Date());
    const end = endOfDay(new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000));
    return { start, end };
}
const iso = (d: Date) => d.toISOString();

const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" from a local Date, using the Date's own local fields (no tz reinterpretation). */
function ymd(d: Date) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Converts one of the backend's ISO-with-offset strings (e.g.
 * "2026-07-18T14:00:00-07:00") into the plain "YYYY-MM-DD HH:mm:ss" wall-clock
 * format @mantine/schedule's rrule expansion expects (see DateTimeStringValue
 * in the Mantine docs). Same idea as eventsTransform.ts's toWallClockString --
 * duplicated here rather than imported because I don't know this file's real
 * relative path to eventsTransform.ts. If you already import that helper
 * elsewhere, swap this out for it instead of keeping two copies.
 */
function toWallClock(isoWithOffset: string) {
    return isoWithOffset.slice(0, 19).replace("T", " ");
}

/**
 * Formats a wall-clock string's time-of-day for display, e.g.
 * "2026-07-18 14:00:00" -> "2:00 PM". Constructing the Date via a bare
 * "YYYY-MM-DDTHH:mm:ss" (no trailing Z/offset) makes the JS engine treat it
 * as local time, so toLocaleTimeString() reproduces the given digits exactly
 * -- no browser-timezone reinterpretation risk, unlike parsing the original
 * offset-bearing ISO string directly.
 */
function formatWallClockTime(wallClock: string) {
    const d = new Date(wallClock.replace(" ", "T"));
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** Small stacked "Jul 27" date badge, from a "YYYY-MM-DD" string. */
function formatDateBadge(day: string) {
    const d = new Date(`${day}T00:00:00`);
    return (
        <div className="upcoming-event-date">
            <Text fz="xs" c="var(--mantine-color-gray-7)">{d.toLocaleDateString([], { month: "short" })}</Text>
            <Text>{d.toLocaleDateString([], { day: "numeric" })}</Text>
        </div>
    );
}

interface UpcomingRow {
    key: string;
    eventId: number;
    title: string;
    dayYmd: string;
    timeLabel: string;
    sortKey: string;
    creatorId: number;
    householdAdminId: number;
}

export function UpcomingThisWeek({ isReady, householdId }: { isReady: boolean; householdId: number }) {
    const { data: currentUser } = useAuthenticateQuery();
    const [editOpen, setEditOpen] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

    const [deleteEvent] = useDeleteEventMutation();

    const handleDeleteEvent = async (eventId: number) => {
        await deleteEvent({ id: eventId, householdId }).unwrap();
    };

    const openEdit = (eventId: number) => {
        setSelectedEventId(eventId);
        setEditOpen(true);
    };
    const closeEdit = useCallback(() => {
        setEditOpen(false);
        setTimeout(() => setSelectedEventId(null), 250);
    }, []);

    const { start, end } = useMemo(rangeTodayPlus6, []);
    const windowStartYmd = useMemo(() => ymd(start), [start]);
    const windowEndYmd = useMemo(() => ymd(end), [end]);
    const args = { householdId, startIso: iso(start), endIso: iso(end) };

    // Keep hook call unconditional; skip if householdId is falsy
    const { data: weekEvents = [], isLoading: eventsLoading } = useGetHouseholdEventsQuery(args, { skip: !householdId });

    const { data: allEvents = [] } = useGetAllHouseholdEventsQuery({ householdId }, { skip: !householdId });

    const selectedEvent =
        selectedEventId != null ? allEvents.find(e => e.id === selectedEventId) : undefined;

    // Reshape into @mantine/schedule's event shape so its rrule expansion can
    // run over them -- this is the same "recurrence.rrule" shape
    // eventsTransform.ts builds for the main calendar views.
    const scheduleEvents = useMemo(() => {
        return weekEvents
            .filter((e) => e.startUtc && e.endUtc)
            .map((e) => {
                const payload = {
                    hasTime: e.hasTime,
                    creatorId: e.creatorId,
                    householdAdminId: e.household.adminId,
                };

                // Two distinct return shapes (rather than spreading
                // `recurrence` in conditionally) so TS infers a real
                // discriminated union for the callback's return type --
                // ScheduleEventData is itself a union
                // (Single | RecurringSeries | RecurringOverride), and a
                // single object type with an optional `recurrence?` field
                // doesn't line up with any one branch of it.
                if (e.rrule) {
                    return {
                        id: e.id,
                        title: e.title,
                        start: toWallClock(e.startUtc),
                        end: toWallClock(e.endUtc),
                        color: "gray",
                        recurrence: { rrule: e.rrule },
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
            });
    }, [weekEvents]);

    // Expands every recurring series into one entry per occurrence that
    // falls in this week's window. One-off events pass through unchanged.
    // This is what makes a recurring event show up on every applicable day
    // instead of just its original start date.
    const expanded = useMemo(() => {
        return expandRecurringEvents({
            events: scheduleEvents,
            rangeStart: `${windowStartYmd} 00:00:00`,
            rangeEnd: `${windowEndYmd} 23:59:59`,
        });
    }, [scheduleEvents, windowStartYmd, windowEndYmd]);

    // Second, independent expansion: any single occurrence (recurring or
    // not) that itself spans multiple calendar days gets one row per day it
    // touches within the window, labeled Google-Calendar-style -- "Begins
    // <time>" on the first day, "All day" on days in between, "Ends <time>"
    // on the last day. Single-day occurrences (the common case) still
    // produce exactly one row, same as before.
    const rows = useMemo(() => {
        const out: UpcomingRow[] = [];

        for (const ev of expanded) {
            const startStr = ev.start as string;
            const endStr = ev.end as string;
            const payload = ev.payload as { hasTime: boolean; creatorId: number; householdAdminId: number };
            const realId = Number(ev.recurringInstance?.recurringEventId ?? ev.id);

            const startDay = startStr.slice(0, 10);
            // All-day events use EXCLUSIVE end bounds (the iCalendar DATE-value
            // convention: `end` marks the start of the day AFTER the event's
            // last real day, not a day it actually occupies) -- subtract a day
            // so a single-day all-day event (start = Day X 00:00, end = Day X+1
            // 00:00) reads as spanning just Day X, not two. This only ever looks
            // at the DATE portion of `end`, never the time, so it's unaffected
            // by the backend currently stamping all-day bounds with a stray
            // 7-hour time-of-day instead of exact midnight -- that drift can
            // corrupt the hour, but not which day is "last." Timed events keep
            // inclusive-end semantics unchanged -- their `end` is a real moment
            // the event is genuinely still happening at.
            const endDay = payload.hasTime
                ? endStr.slice(0, 10)
                : addDaysYmd(endStr.slice(0, 10), -1);

            if (startDay === endDay) {
                out.push({
                    key: String(ev.id),
                    eventId: realId,
                    title: ev.title,
                    dayYmd: startDay,
                    timeLabel: payload.hasTime ? formatWallClockTime(startStr) : "All Day",
                    sortKey: startStr,
                    creatorId: payload.creatorId,
                    householdAdminId: payload.householdAdminId,
                });
                continue;
            }

            // Clip the span to what's actually visible in this week.
            const firstVisible = startDay > windowStartYmd ? startDay : windowStartYmd;
            const lastVisible = endDay < windowEndYmd ? endDay : windowEndYmd;

            for (let day = firstVisible; day <= lastVisible; day = nextYmd(day)) {
                let timeLabel: string;
                if (!payload.hasTime) {
                    // An all-day event that happens to span multiple days --
                    // there's no clock time to show on any of its days.
                    timeLabel = "All Day";
                } else if (day === startDay) {
                    timeLabel = `Begins ${formatWallClockTime(startStr)}`;
                } else if (day === endDay) {
                    timeLabel = `Ends ${formatWallClockTime(endStr)}`;
                } else {
                    timeLabel = "All day";
                }

                out.push({
                    key: `${ev.id}__${day}`,
                    eventId: realId,
                    title: ev.title,
                    dayYmd: day,
                    timeLabel,
                    sortKey: `${day} ${day === startDay ? startStr.slice(11) : "00:00:00"}`,
                    creatorId: payload.creatorId,
                    householdAdminId: payload.householdAdminId,
                });
            }
        }

        return out.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    }, [expanded, windowStartYmd, windowEndYmd]);

    if (!isReady || eventsLoading) return (
        <div className="upcoming-events-container">
            <Stack className="upcoming-events" gap="xs">
                {Array.from({ length: 5 }).map((_, i) => <UpcomingEventSkeleton key={i} />)}
            </Stack>
        </div>
    )

    return (
        <div className="upcoming-events-container">
            <Stack className="upcoming-events" gap="xs">
                {!rows.length
                    ? <div className="featured-empty-state">Good news, boss - your week is wide open!</div>
                    : rows.map((r) => (
                        <Paper color="white" key={r.key} radius="md" p=".5rem" shadow="xs" className="upcoming-event">
                            <Group gap=".25rem" justify="space-between">
                                <Group wrap="nowrap" miw={0} flex={1}>
                                    {formatDateBadge(r.dayYmd)}
                                    <Stack gap={0} maw="100%" miw={0}>
                                        <Text fw={500} fz="sm" truncate miw={0}>
                                            {r.title}
                                        </Text>
                                        <Text fz="xs" c="var(--mantine-color-gray-7)">{r.timeLabel}</Text>
                                    </Stack>
                                </Group>
                                {(r.householdAdminId === currentUser.id || r.creatorId === currentUser.id) && (
                                    <div>
                                        <EventMenu
                                            isEditing={editOpen && selectedEventId === r.eventId}
                                            setIsEditing={(val) => val ? openEdit(r.eventId) : null}

                                            onDelete={() => handleDeleteEvent(r.eventId)}

                                        />
                                    </div>
                                )}
                            </Group>
                        </Paper>
                    ))
                }
            </Stack>

            <EventForm
                householdId={householdId}
                opened={editOpen}
                onClose={closeEdit}
                edit={Boolean(selectedEvent)}
                event={selectedEvent}
                initialDate={selectedEvent?.startUtc ? new Date(selectedEvent.startUtc) : new Date()}
            />

        </div >
    );
}

const UpcomingEventSkeleton = () => {
    return (
        <Paper color="white" radius="md" p=".5rem" shadow="xs" className="upcoming-event">
            <Group justify="space-between">
                <Group>
                    <div className="event-skeleton-date"><Skeleton h={35} w={30} /></div>
                    <Stack gap='.25rem'>
                        <Skeleton w="300px" h={8} />
                        <Skeleton w="50px" h={6} />
                    </Stack>
                </Group>
            </Group>
        </Paper>
    )
}
