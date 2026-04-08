// src/features/calendar/UpcomingNext7Days.tsx
import { ActionIcon, ActionIconGroup, Anchor, Button, Card, Group, Paper, ScrollArea, Skeleton, Stack, Text } from "@mantine/core";
import { useCallback, useMemo, useState } from "react";
import { useDeleteEventMutation, useGetAllHouseholdEventsQuery, useGetHouseholdEventsQuery, type CalendarEvent } from "@/store/eventSlice";
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import DeleteRounded from '@mui/icons-material/Delete';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import "../styles/UpcomingThisWeek.css"
import { QuickAddEvent } from "./QuickAddEvent";
import { Box } from "lucide-react";
import { EventMenu } from "./EventMenu";
import { useAuthenticateQuery } from "@/store";

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
            <Text fz="xs" c="var(--mantine-color-gray-7)">{d.toLocaleDateString([], { month: "short" })}</Text>
            <Text>{d.toLocaleDateString([], { day: "numeric" })}</Text>
        </div>)
}
function formatTime(isoUtc: string) {
    const d = new Date(isoUtc);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

export function UpcomingThisWeek({ isReady, householdId }: { isReady: boolean; householdId: number }) {
    const { data: currentUser } = useAuthenticateQuery();
    const [editOpen, setEditOpen] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
    const isEditingRow = editingEvent !== null;

    const [deleteEvent] = useDeleteEventMutation();

    const handleDeleteEvent = async (eventId: number) => {
        await deleteEvent({ id: eventId, householdId }).unwrap();
    };

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

    if (!isReady) return (
        <div className="upcoming-events-container">
            <Stack className="upcoming-events" gap="xs">
                {Array.from({ length: 5 }).map((_, i) => <UpcomingEventSkeleton key={i} />)}
            </Stack>
        </div>
    )

    return (
        <div className="upcoming-events-container">
            <Stack className="upcoming-events" gap="xs">
                {!upcoming.length
                    ? <div className="featured-empty-state">Your week is wide open! Time to plan something fun.</div>
                    : upcoming.map((e) => {
                        // Defensive: e.startUtc is defined due to the filter; cast for TS
                        const startIso = e.startUtc as string;

                        const left = e.hasTime ? formatDate(startIso)
                            : formatDate(startIso);

                        const right = e.hasTime ? formatTime(startIso) : "All Day"

                        return (
                            <Paper color="white" key={e.id} radius="md" p=".5rem" shadow="xs" className="upcoming-event">
                                <Group gap=".25rem" justify="space-between">
                                    <Group wrap="nowrap" miw={0} flex={1}>
                                        {left}
                                        <Stack gap={0} maw="100%" miw={0}>
                                            <Text fw={500} fz="sm" truncate miw={0}>
                                                {e.title}
                                            </Text>
                                            <Text fz="xs" c="var(--mantine-color-gray-7)">{right}</Text>
                                        </Stack>
                                    </Group>
                                    {(e.household.adminId === currentUser.id || e.creatorId === currentUser.id) && (
                                        <div>
                                            <EventMenu
                                                isEditing={editingEvent?.id === e.id}
                                                setIsEditing={(val) => val ? openEdit(e) : null}

                                                onDelete={() => handleDeleteEvent(e.id)}

                                            />
                                        </div>
                                    )}
                                </Group>
                            </Paper>
                        );
                    })
                }
            </Stack>

            <QuickAddEvent
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