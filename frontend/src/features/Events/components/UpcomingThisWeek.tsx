// src/features/calendar/UpcomingNext7Days.tsx
import { Card, Stack, Text } from "@mantine/core";
import { useMemo } from "react";
import { useGetHouseholdEventsQuery } from "@/store/eventSlice"; // <- ensure this points to the file that defines getHouseholdEvents

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
    return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }); // e.g., Fri, Sep 19
}
function formatTime(isoUtc: string) {
    const d = new Date(isoUtc);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); // e.g., 3:30 PM
}

export function UpcomingThisWeek({ householdId }: { householdId: number }) {
    const { start, end } = useMemo(rangeTodayPlus6, []);
    const args = { householdId, startIso: iso(start), endIso: iso(end) };

    // Keep hook call unconditional; skip if householdId is falsy
    const { data: events = [] } = useGetHouseholdEventsQuery(args, { skip: !householdId });

    const upcoming = useMemo(() => {
        return events
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
    }, [events, start, end]);

    if (!upcoming.length) return <Text c="dimmed">Nothing in the next 7 days — add one.</Text>;

    return (
        <Stack>
            {upcoming.map((e) => {
                // Defensive: e.startUtc is defined due to the filter; cast for TS
                const startIso = e.startUtc as string;

                const left = e.hasTime ? `${formatDate(startIso)} · ${formatTime(startIso)}`
                    : `${formatDate(startIso)}`;

                return (
                    <Card key={e.id} withBorder padding="sm" radius="md">
                        <Text fw={600}>
                            {left} — {e.title}
                        </Text>
                    </Card>
                );
            })}
        </Stack>
    );
}
