// src/features/calendar/WeekStrip.tsx (rolling week: today + 6)
import { useMemo, useState } from "react";
import { Group, Paper, Text, Indicator, UnstyledButton } from "@mantine/core";
import dayjs from "dayjs";
import { useGetHouseholdEventsQuery } from "@/store/eventSlice";
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

export function WeekStrip({ householdId }: { householdId: number }) {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [open, setOpen] = useState(false);

    // rolling range: today .. today+6
    const { start, end } = useMemo(rangeTodayPlus6, []);
    const { data: events = [] } = useGetHouseholdEventsQuery({
        householdId,
        startIso: iso(start),
        endIso: iso(end),
    });

    // event counts per day (by start date)
    const counts = useMemo(() => {
        const map: Record<string, number> = {};
        for (const e of events) {
            const key = dayjs(e.startUtc).format("YYYY-MM-DD");
            map[key] = (map[key] ?? 0) + 1;
        }
        return map;
    }, [events]);

    // build 7 rolling days starting from today
    const days = useMemo(
        () =>
            Array.from({ length: 7 }, (_, i) => {
                const d = new Date(start);
                d.setDate(d.getDate() + i);
                return d;
            }),
        [start]
    );

    return (
        <>
            <Group gap="xs" wrap="nowrap">
                {days.map((d) => {
                    const key = dayjs(d).format("YYYY-MM-DD");
                    const has = !!counts[key];
                    const isToday = dayjs(d).isSame(new Date(), "day");

                    return (
                        <UnstyledButton
                            key={key}
                            onClick={() => {
                                setSelectedDate(d);
                                setOpen(true);
                            }}
                            aria-label={`Add on ${dayjs(d).format("ddd, MMM D")}`}
                            style={{ flex: 1 }}
                        >
                            <Indicator size={6} disabled={!has}>
                                <Paper
                                    withBorder
                                    radius="md"
                                    p="sm"
                                    style={{
                                        textAlign: "center",
                                        borderColor: isToday ? "var(--mantine-color-primary-6)" : undefined,
                                    }}
                                >
                                    <Text size="xs" c="dimmed">
                                        {dayjs(d).format("ddd")}
                                    </Text>
                                    <Text size="lg" fw={600}>
                                        {dayjs(d).date()}
                                    </Text>
                                </Paper>
                            </Indicator>
                        </UnstyledButton>
                    );
                })}
            </Group>

            <QuickAddEvent
                householdId={householdId}
                opened={open}
                initialDate={selectedDate}
                onClose={() => setOpen(false)}
            />
        </>
    );
}
