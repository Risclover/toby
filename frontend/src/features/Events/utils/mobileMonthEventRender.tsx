import type { ComponentProps } from "react";
import { MobileMonthView } from "@mantine/schedule";
import { UnstyledButton } from "@mantine/core";
import type { EventColorPayload } from "./getEventColors";

type MobileMonthViewProps = ComponentProps<typeof MobileMonthView>;

export const renderMobileMonthEvent: NonNullable<MobileMonthViewProps["renderEvent"]> = (event, props) => {
    const payload = event.payload as (EventColorPayload & { isDotSibling?: boolean }) | undefined;
    const { style, ...others } = props;

    if (payload?.isDotSibling) {
        // RenderEvent must return a real element, not null -- hide the
        // extra per-member siblings instead of omitting them, so the
        // selected-day list shows exactly one row per real event.
        return <UnstyledButton {...others} style={{ ...style, display: "none" }} />;
    }

    return <UnstyledButton {...others} style={style} />;
};