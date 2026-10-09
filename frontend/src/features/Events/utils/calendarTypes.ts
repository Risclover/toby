import type { ComponentProps } from "react";
import type { Schedule } from "@mantine/schedule";

export type ScheduleViewLevel = NonNullable<ComponentProps<typeof Schedule>["view"]>;
export type ScheduleEventData = NonNullable<ComponentProps<typeof Schedule>["events"]>[number];