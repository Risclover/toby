import type { ScheduleEventData } from "./calendarTypes";
import type { EventColorPayload } from "./getEventColors";
import { renderEventBody } from "./multiColorScheduleProps";
import type { MoveData } from "./persistEventMove";

const canInteractWithEvent = (event: { payload?: unknown }) =>
    !(event.payload as EventColorPayload | undefined)?.isDayViewContinuation;

type InteractiveViewPropsParams = {
    onMove: (data: MoveData) => Promise<void>;
    onEventClick: (event: ScheduleEventData) => void;
};

/** The drag, resize, select and click props Day, Week and Month views share. */
export const getInteractiveViewProps = ({ onMove, onEventClick }: InteractiveViewPropsParams) => ({
    withEventsDragAndDrop: true,
    withEventResize: true,
    withDragSlotSelect: true,
    canDragEvent: canInteractWithEvent,
    canResizeEvent: canInteractWithEvent,
    onEventDrop: onMove,
    onEventResize: onMove,
    onEventClick,
    renderEventBody,
});