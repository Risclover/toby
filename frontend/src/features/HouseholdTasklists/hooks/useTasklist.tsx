import { useReorderTasksMutation, type Task } from "@/store/taskSlice";
import { KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useEffect, useMemo, useState } from "react";


type Props = {
    listId: number;
    tasks: Task[];
}

export const useTasklist = ({ tasks, listId }: Props) => {
    // 1. Sort incoming props to ensure we start with the correct server order
    const sortedTasks = useMemo(() => tasks, [tasks]);
    const [local, setLocal] = useState<Task[]>(sortedTasks);

    // 2. Sync local state with props ONLY when the task IDs actually change
    //    (e.g., a new task was added or one was deleted), NOT on every re-render.
    useEffect(() => {
        const propIds = sortedTasks.map(t => t.id).join(',');
        const localIds = local.map(t => t.id).join(',');

        // Only reset if the structural composition of the list changes
        if (propIds !== localIds) {
            setLocal(sortedTasks);
        }
    }, [sortedTasks]);

    const [reorderTasks] = useReorderTasksMutation();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Helper to persist changes
    const executeReorder = async (newOrder: Task[]) => {
        // Optimistically update UI
        setLocal(newOrder);

        const orderedIds = newOrder.map((t) => t.id);

        try {
            // Send new order to server
            await reorderTasks({ listId, orderedIds }).unwrap();
        } catch (err) {
            console.error("Failed to reorder:", err);
            // Revert to server state on failure
            setLocal(sortedTasks);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = local.findIndex((t) => t.id === Number(active.id));
        const newIndex = local.findIndex((t) => t.id === Number(over.id));

        if (oldIndex !== -1 && newIndex !== -1) {
            const next = arrayMove(local, oldIndex, newIndex);
            executeReorder(next);
        }
    };

    const handleManualMove = (taskId: number, direction: 'up' | 'down') => {
        const currentIndex = local.findIndex((t) => t.id === taskId);
        if (currentIndex === -1) return;

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= local.length) return;

        const next = arrayMove(local, currentIndex, newIndex);
        executeReorder(next);
    };

    return {
        sensors,
        handleDragEnd,
        handleManualMove,
        local,

    }
}