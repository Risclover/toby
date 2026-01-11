import { useMobileTasklist } from "@/features/HouseholdTasklists/hooks/useMobileTasklist";
import { useCallback, useState } from "react"

type Props = {
    moveTask: (dragIndex: number, hoverIndex: number) => void;
}
export const useDragMode = ({ moveTask }: Props) => {
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    const [swipedTaskId, setSwipedTaskId] = useState<string | null>(null);

    const handleDragStart = useCallback((index: number) => {
        setSwipedTaskId(null); // Close any swiped item when dragging starts
        setDraggedItemIndex(index);
    }, []);

    const handleDragEnter = useCallback((index: number) => {
        if (draggedItemIndex === null || draggedItemIndex === index) {
            return;
        }
        moveTask(draggedItemIndex, index);
        setDraggedItemIndex(index);
    }, [draggedItemIndex, moveTask]);

    const handleDragEnd = useCallback(() => {
        setDraggedItemIndex(null);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);


    return { handleDragStart, handleDragEnter, handleDragEnd, handleDragOver, swipedTaskId, setSwipedTaskId }

}