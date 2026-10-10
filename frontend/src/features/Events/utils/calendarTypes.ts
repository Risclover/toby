import type { ComponentProps } from "react";

import type { Schedule } from "@mantine/schedule";

import type { EventColorPayload } from "./getEventColors";

export type ScheduleViewLevel = NonNullable<ComponentProps<typeof Schedule>["view"]>;
export type ScheduleEventData = NonNullable<ComponentProps<typeof Schedule>["events"]>[number];
export type EventSource = NonNullable<EventColorPayload["source"]>;

export type CalendarViewProps = {
    date: string;
    onDateChange: (date: string) => void;
    onViewChange: (view: ScheduleViewLevel) => void;
};