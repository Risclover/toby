import type { TooltipProps } from "@mantine/core";

export const TOOLTIP_EVENTS = { hover: true, focus: true, touch: true } as const;

export const EVENT_ROW_TOOLTIP_PROPS: Partial<TooltipProps> = {
    position: "top",
    transitionProps: { transition: "pop", duration: 100 },
    withinPortal: true,
    withArrow: true,
    events: TOOLTIP_EVENTS,
};