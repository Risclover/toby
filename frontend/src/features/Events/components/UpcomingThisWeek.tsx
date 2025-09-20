// src/features/calendar/UpcomingNext7Days.tsx
import { Card, Stack, Text } from "@mantine/core";
import { useMemo } from "react";
import { useGetHouseholdEventsQuery } from "@/store/eventSlice";

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

function formatDateTime(isoUtc: string) {
    const d = new Date(isoUtc); // ISO with Z -> converts to local time correctly
    const datePart = d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }); // e.g., Fri, Sep 19
    const timePart = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });               // e.g., 3:30 PM
    return `${datePart} · ${timePart}`;
}

export function UpcomingThisWeek({ householdId }: { householdId: number }) {
    const { start, end } = useMemo(rangeTodayPlus6, []);
    const args = { householdId, startIso: iso(start), endIso: iso(end) };

    // Keep hook call unconditional; skip if householdId is falsy
    const { data: events = [] } = useGetHouseholdEventsQuery(args, { skip: !householdId });

    const upcoming = useMemo(() => {
        return events
            .filter((e) => {
                const s = new Date(e.startUtc);
                return s >= start && s <= end;
            })
            .sort((a, b) => +new Date(a.startUtc) - +new Date(b.startUtc));
    }, [events, start, end]);

    if (!upcoming.length) return <Text c="dimmed">Nothing in the next 7 days — add one.</Text>;

    return (
        <Stack>
            {upcoming.map((e) => (
                <Card key={e.id} withBorder padding="sm" radius="md">
                    <Text fw={600}>
                        {formatDateTime(e.startUtc)} — {e.title}
                    </Text>
                </Card>
            ))}
        </Stack>
    );
}
