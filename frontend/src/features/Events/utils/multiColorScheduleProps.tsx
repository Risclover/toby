import type { ComponentProps } from "react";
import dayjs from "dayjs";
import { Schedule } from "@mantine/schedule";
import { EventMemberDots } from "../components/CalendarPage/EventColorDots";
import { EventColorBackground } from "../components/CalendarPage/EventColorBackground";
import { getEventTextColor, type EventColorPayload } from "./getEventColors";

type ScheduleProps = ComponentProps<typeof Schedule>;

/**
 * Single body renderer shared across every view (day/week/month/agenda) via
 * Schedule's top-level renderEventBody. We stopped using the per-view
 * renderEvent (a full root-element override) because it was silently
 * discarding the library's own default `children` -- which is where its
 * drag handle wiring and .mantine-Schedule-eventResizeHandle elements live,
 * breaking drag/resize everywhere. renderEventBody instead renders INSIDE
 * the library's own root wrapper, so native drag/resize stay intact and we
 * only customize the visual content.
 */
export const renderEventBody: NonNullable<ScheduleProps["renderEventBody"]> = (event) => {
    const payload = event.payload as EventColorPayload | undefined;
    const colors = payload?.colors ?? [event.color];
    const isMultiUser = colors.length > 1;

    const content = (
        <div
            style={{
                color: getEventTextColor(colors),
                padding: "3px 6px",
                display: "flex",
                gap: 4,
                alignItems: "center",
                overflow: "hidden",
                whiteSpace: "nowrap",
                fontSize: "12px",
                fontWeight: 500,
                fontFamily: "var(--font-family-sora)",
                height: "100%",
            }}
        >
            {isMultiUser && <EventMemberDots colors={colors} />}
            {payload?.hasTime !== false && <span>{dayjs(event.start).format("h:mm")}</span>}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{event.title}</span>
        </div>
    );

    if (isMultiUser) {
        return <div style={{ height: "100%", background: "var(--mantine-color-indigo-0)" }}>{content}</div>;
    }

    return <EventColorBackground color={colors[0] ?? "blue"}>{content}</EventColorBackground>;
};