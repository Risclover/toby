import { useState } from "react";
import { Popover, Text, UnstyledButton, Stack, Group } from "@mantine/core";
import { useWeekAllDayEvents } from "../../hooks/useWeekAllDayEvents";
import type { ScheduleEventData } from "../../utils/weekAllDayLayout";
import { toLightCssColor, toDotCssColor, getEventTextColor, type EventColorPayload } from "../../utils/getEventColors";
import { EventMemberDots } from "./EventColorDots";

const DAYS_IN_WEEK = 7;
const LANE_HEIGHT = 26;

/**
 * Width of the leading gutter column, meant to match WeekView's own
 * time-label column so this row's day columns line up with the grid it
 * sits above. @mantine/schedule doesn't expose that width as a prop --
 * if these ever drift out of alignment, check `.mantine-WeekView-weekViewCorner`
 * in devtools and adjust this one constant.
 */
export const WEEK_ALL_DAY_GUTTER_WIDTH = 56;

type Props = {
    /** "YYYY-MM-DD", first day of the visible week */
    weekStartDate: string;
    events: ScheduleEventData[];
    onEventClick?: (event: ScheduleEventData) => void;
};

function AllDayChip({ event, onClick }: { event: ScheduleEventData; onClick?: () => void }) {
    const payload = event.payload as EventColorPayload | undefined;
    const colors = payload?.colors ?? [event.color as string];
    const isMultiUser = colors.length > 1;

    return (
        <UnstyledButton
            onClick={onClick}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                height: LANE_HEIGHT - 4,
                padding: "0 6px",
                borderRadius: 4,
                overflow: "hidden",
                width: "100%",
                background: isMultiUser ? "var(--mantine-color-indigo-0)" : toLightCssColor(colors[0] ?? "blue"),
                color: getEventTextColor(colors),
            }}
        >
            {isMultiUser && <EventMemberDots colors={colors} />}
            <Text fz={12} fw={500} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {event.title}
            </Text>
        </UnstyledButton>
    );
}

function OverflowPill({
    events,
    onEventClick,
}: {
    events: ScheduleEventData[];
    onEventClick?: (event: ScheduleEventData) => void;
}) {
    const [opened, setOpened] = useState(false);

    return (
        <Popover opened={opened} onChange={setOpened} withinPortal position="bottom-start" shadow="md">
            <Popover.Target>
                <UnstyledButton
                    onClick={() => setOpened((o) => !o)}
                    style={{ width: "100%", height: LANE_HEIGHT - 4, fontSize: 11, color: "var(--mantine-color-dimmed)", padding: "0 6px" }}
                >
                    +{events.length} more
                </UnstyledButton>
            </Popover.Target>
            <Popover.Dropdown>
                <Stack gap={4}>
                    {events.map((event) => {
                        const payload = event.payload as EventColorPayload | undefined;
                        const colors = payload?.colors ?? [event.color as string];
                        return (
                            <UnstyledButton
                                key={event.id}
                                onClick={() => {
                                    onEventClick?.(event);
                                    setOpened(false);
                                }}
                            >
                                <Group gap={6} wrap="nowrap">
                                    {colors.length > 1 ? (
                                        <EventMemberDots colors={colors} />
                                    ) : (
                                        <span
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: "50%",
                                                background: toDotCssColor(colors[0] ?? "blue"),
                                            }}
                                        />
                                    )}
                                    <Text fz={13}>{event.title}</Text>
                                </Group>
                            </UnstyledButton>
                        );
                    })}
                </Stack>
            </Popover.Dropdown>
        </Popover>
    );
}

/**
 * Replaces @mantine/schedule's built-in WeekView all-day section -- disabled
 * via `withAllDaySlots={false}` on the WeekView this renders directly above
 * -- because that section overlays overlapping all-day/multi-day events
 * instead of stacking them into separate rows, becoming unreadable as soon
 * as two land on the same day. Lane placement comes from
 * useWeekAllDayEvents; this component only turns that layout into a grid.
 *
 * There's no supported way to inject a row between WeekView's own day-of-week
 * header and its time grid, so this renders as its own strip directly above
 * the whole WeekView instead -- one row prepended to the calendar rather
 * than nested inside it. The leading gutter column is sized to
 * WEEK_ALL_DAY_GUTTER_WIDTH to line up with WeekView's time-label column;
 * nudge that constant if they drift apart visually.
 *
 * Known gap: unlike WeekView's own all-day slot, these bars aren't
 * draggable/resizable yet. Timed events in the grid below are unaffected
 * and keep drag/resize as before.
 */
export function WeekAllDayRow({ weekStartDate, events, onEventClick }: Props) {
    const { visibleLanes, laneCount, overflowByDay } = useWeekAllDayEvents(events, weekStartDate);

    if (laneCount === 0 && overflowByDay.length === 0) return null;

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: `${WEEK_ALL_DAY_GUTTER_WIDTH}px repeat(${DAYS_IN_WEEK}, 1fr)`,
                gridAutoRows: LANE_HEIGHT,
                borderTop: "1px solid var(--mantine-color-gray-3)",
                borderBottom: "1px solid var(--mantine-color-gray-3)",
                padding: "2px 0",
            }}
        >
            <Text fz={10} c="dimmed" fw={500} style={{ gridColumn: 1, gridRow: "1 / -1", alignSelf: "center", paddingLeft: 4 }}>
                All day
            </Text>
            {visibleLanes.map((item) => (
                <div
                    key={item.event.id}
                    style={{
                        gridColumn: `${item.startCol + 2} / span ${item.span}`,
                        gridRow: item.lane + 1,
                        padding: "1px 2px",
                    }}
                >
                    <AllDayChip event={item.event} onClick={() => onEventClick?.(item.event)} />
                </div>
            ))}
            {overflowByDay.map(({ dayCol, events: hidden }) => (
                <div key={dayCol} style={{ gridColumn: dayCol + 2, gridRow: laneCount, padding: "1px 2px" }}>
                    <OverflowPill events={hidden} onEventClick={onEventClick} />
                </div>
            ))}
        </div>
    );
}