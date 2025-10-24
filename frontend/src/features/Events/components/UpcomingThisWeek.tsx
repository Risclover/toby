// src/features/calendar/UpcomingNext7Days.tsx
import { Anchor, Button, Card, Group, ScrollArea, Stack, Text } from "@mantine/core";
import { useCallback, useMemo, useState } from "react";
import { useGetAllHouseholdEventsQuery, useGetHouseholdEventsQuery, type CalendarEvent } from "@/store/eventSlice";
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import DeleteRounded from '@mui/icons-material/Delete';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import "../styles/UpcomingThisWeek.css"
import { QuickAddEvent } from "./QuickAddEvent";

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

function formatDate(isoUtc: string) {
    const d = new Date(isoUtc);
    return (
        <div className="upcoming-event-date">
            <Text fz="xs" c="var(--sub-text)">{d.toLocaleDateString([], { month: "short" })}</Text>
            <Text>{d.toLocaleDateString([], { day: "numeric" })}</Text>
        </div>)
}
function formatTime(isoUtc: string) {
    const d = new Date(isoUtc);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

export function UpcomingThisWeek({ householdId }: { householdId: number }) {
    const [editOpen, setEditOpen] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

    const openEdit = (evt: CalendarEvent) => {
        setSelectedEventId(evt.id);
        setEditOpen(true);
    };
    const closeEdit = useCallback(() => {
        setEditOpen(false);
        setTimeout(() => setSelectedEventId(null), 250);
    }, []);

    const { start, end } = useMemo(rangeTodayPlus6, []);
    const args = { householdId, startIso: iso(start), endIso: iso(end) };

    // Keep hook call unconditional; skip if householdId is falsy
    const { data: weekEvents = [] } = useGetHouseholdEventsQuery(args, { skip: !householdId });
    const { data: allEvents = [] } = useGetAllHouseholdEventsQuery({ householdId }, { skip: !householdId });

    const selectedEvent =
        selectedEventId != null ? allEvents.find(e => e.id === selectedEventId) : undefined;

    const upcoming = useMemo(() => {
        return weekEvents
            .filter((e) => {
                // Only events with a startUtc belong in this date window
                if (!e.startUtc) return false;
                const s = new Date(e.startUtc);
                return s >= start && s <= end;
            })
            .sort((a, b) => {
                const sa = a.startUtc ? +new Date(a.startUtc) : Number.POSITIVE_INFINITY;
                const sb = b.startUtc ? +new Date(b.startUtc) : Number.POSITIVE_INFINITY;
                return sa - sb;
            });
    }, [weekEvents, start, end]);

    if (!upcoming.length) return <Text c="dimmed">Nothing in the next 7 days — add one.</Text>;

    return (
        <div>
            <Group justify="space-between" className="upcoming-events-header">
                <Text fz="xl" c="white" fw={500}>Upcoming</Text>
                <Anchor c="cyan.4">View all<ChevronRightRoundedIcon /></Anchor>
            </Group>
            <ScrollArea.Autosize mah={229}>
                <Stack className="upcoming-events" gap="xs">
                    {upcoming.map((e) => {
                        // Defensive: e.startUtc is defined due to the filter; cast for TS
                        const startIso = e.startUtc as string;

                        const left = e.hasTime ? formatDate(startIso)
                            : formatDate(startIso);

                        const right = e.hasTime ? formatTime(startIso) : "All Day"

                        return (
                            <Card key={e.id} padding="xs" radius="md" className="upcoming-event">
                                <Group justify="space-between">
                                    <Group>
                                        {left}
                                        <Stack gap={0}>
                                            <Text fw={600} c="white" fz="sm">
                                                {e.title}
                                            </Text>
                                            <Text fz="xs" c="var(--sub-text)">{right}</Text>
                                        </Stack>
                                    </Group>
                                    <div className="upcoming-event-btns">
                                        <button
                                            className="upcoming-event-btn"
                                            onClick={() => openEdit(e)}
                                            aria-label={`Edit ${e.title}`}
                                        >
                                            <BorderColorRoundedIcon />
                                        </button>
                                        <button className="upcoming-event-btn"><DeleteRounded /></button>
                                    </div>
                                </Group>
                            </Card>
                        );
                    })}
                </Stack>
            </ScrollArea.Autosize>

            <QuickAddEvent
                householdId={householdId}
                opened={editOpen}
                onClose={closeEdit}
                edit={Boolean(selectedEvent)}
                event={selectedEvent}
                initialDate={selectedEvent?.startUtc ? new Date(selectedEvent.startUtc) : new Date()}
            />

        </div>
    );
} 