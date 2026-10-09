import type { ComponentProps } from "react";
import { UnstyledButton } from "@mantine/core";
import dayjs from "dayjs";
import { renderEventBody, type ScheduleEventData } from "../../utils";

const FILL_STYLE = { position: "absolute", inset: 0 } as const;
const FILL_PASSTHROUGH_STYLE = { ...FILL_STYLE, pointerEvents: "none" } as const;

type WeekEventButtonProps = {
    event: ScheduleEventData;
    buttonProps: ComponentProps<typeof UnstyledButton>;
    draggingEventId: string | number | null;
};

export const WeekEventButton = ({ event, buttonProps, draggingEventId }: WeekEventButtonProps) => {
    const isMultiDay = !dayjs(event.start).isSame(dayjs(event.end), "day");

    if (isMultiDay) {
        const isIdle = draggingEventId === null;
        const isBeingDragged = !isIdle && String(draggingEventId) === String(event.id);
        const style = isIdle || isBeingDragged
            ? { ...buttonProps.style, pointerEvents: "auto" }
            : buttonProps.style;

        return (
            <UnstyledButton {...buttonProps} style={style}>
                {renderEventBody(event)}
            </UnstyledButton>
        );
    }

    return (
        <UnstyledButton {...buttonProps}>
            <div style={FILL_STYLE}>{buttonProps.children}</div>
            <div style={FILL_PASSTHROUGH_STYLE}>{renderEventBody(event)}</div>
        </UnstyledButton>
    );
};