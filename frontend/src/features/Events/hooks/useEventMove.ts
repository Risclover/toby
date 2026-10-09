import {
    useCreateEventMutation,
    useExcludeEventOccurrenceMutation,
    useUpdateEventMutation,
    type CalendarEvent,
} from "@/store";
import { persistEventMove, type MoveData } from "../utils/persistEventMove";
import { isAllDayValue } from "../utils/getEventColors";

type UseEventMoveProps = {
    householdId: number | undefined;
    visibleEvents: CalendarEvent[];
};

/** Returns the handler for drag-and-drop and resize, which both persist as a move. */
export const useEventMove = ({ householdId, visibleEvents }: UseEventMoveProps) => {
    const [createEvent] = useCreateEventMutation();
    const [updateEvent] = useUpdateEventMutation();
    const [excludeEventOccurrence] = useExcludeEventOccurrenceMutation();

    return async (data: MoveData) => {
        if (!householdId) return;

        const sourceEvent = visibleEvents.find(({ id }) => id === data.eventId);
        const { payload } = data.event;

        try {
            await persistEventMove(
                {
                    ...data,
                    event: {
                        ...data.event,
                        payload: {
                            ...payload,
                            hasTime: sourceEvent ? !isAllDayValue(sourceEvent.hasTime) : payload?.hasTime,
                            tzid: sourceEvent?.tzid ?? payload?.tzid,
                        },
                    },
                },
                {
                    householdId,
                    updateEvent,
                    createEvent,
                    excludeEventOccurrence,
                }
            );
        } catch (error) {
            console.error(error);
        }
    };
};