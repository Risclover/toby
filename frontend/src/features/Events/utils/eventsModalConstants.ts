import type { TooltipProps } from "@mantine/core";

export const EVENTS_MODAL_SMALL_SCREEN_WIDTH = 475;

export const EVENTS_FILTER = {
    MINE_ONLY: "Mine only",
    GROUP_BY_USER: "Group by user",
} as const;

export type EventsFilter = (typeof EVENTS_FILTER)[keyof typeof EVENTS_FILTER];

export const EVENTS_FILTER_OPTIONS: EventsFilter[] = Object.values(EVENTS_FILTER);

export const TOOLTIP_EVENTS = { hover: true, focus: true, touch: true } as const;

export const EVENT_ROW_TOOLTIP_PROPS: Partial<TooltipProps> = {
    position: "top",
    transitionProps: { transition: "pop", duration: 100 },
    withinPortal: true,
    withArrow: true,
    events: TOOLTIP_EVENTS,
};