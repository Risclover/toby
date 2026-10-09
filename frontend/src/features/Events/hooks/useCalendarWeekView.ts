import { useState } from "react";

type DraggedEvent = {
    id: string | number;
};

export const useCalendarWeekView = () => {
    const [draggingEventId, setDraggingEventId] = useState<string | number | null>(null);

    const handleDragStart = (event: DraggedEvent) => setDraggingEventId(event.id);
    const handleDragEnd = () => setDraggingEventId(null);

    return { draggingEventId, handleDragStart, handleDragEnd };
};