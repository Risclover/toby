import type { TooltipProps } from "@mantine/core";

export const EVENT_ROW_TOOLTIP_PROPS: Partial<TooltipProps> = {
    position: "top",
    transitionProps: { transition: "pop", duration: 100 },
    withinPortal: true,
    withArrow: true,
    events: { hover: true, focus: true, touch: true },
};