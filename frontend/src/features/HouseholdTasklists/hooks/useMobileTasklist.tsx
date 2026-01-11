import { type Todo } from "@/store/todoSlice";
import { useCallback, useState } from "react";

type Props = {
    initialTasks: Todo[] | undefined;
}

export const useMobileTasklist = ({ initialTasks }: Props) => {
    const [tasks, setTasks] = useState<Todo[] | undefined>(initialTasks)

    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    const [swipedTaskId, setSwipedTaskId] = useState<number | null>(null);

    const moveTask = useCallback((dragIndex: number, hoverIndex: number) => {
        if (!initialTasks || hoverIndex < 0 || hoverIndex >= initialTasks.length) return;

        setTasks(prevTasks => {
            if (!prevTasks) return prevTasks;
            const newTasks = [...prevTasks];
            const [removed] = newTasks.splice(dragIndex, 1);
            newTasks.splice(hoverIndex, 0, removed);
            return newTasks;
        });
    }, [initialTasks]);

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

    return { tasks, moveTask, swipedTaskId, setSwipedTaskId, handleDragStart, handleDragEnter, handleDragEnd, handleDragOver };
}