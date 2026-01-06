// src/components/TaskListDnd.tsx
import { useEffect, useMemo, useState } from "react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useReorderTodosMutation, type Todo } from "@/store/todoSlice";
import { HouseholdTasklistPageTask } from "./HouseholdTasklistPageTask";
import { useAuthenticateQuery } from "@/store/authSlice";
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useIsSmallScreen } from "@/hooks/useIsSmallScreen";
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { Button } from "@mantine/core";

type Props = {
    listId: number;
    tasks: Todo[];
};

export function TaskListDnd({ listId, tasks }: Props) {
    // 1. Sort incoming props to ensure we start with the correct server order
    const sortedTasks = useMemo(
        () => [...tasks].sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0)),
        [tasks]
    );

    const [local, setLocal] = useState<Todo[]>(sortedTasks);

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

    const [reorderTodos] = useReorderTodosMutation();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Helper to persist changes
    const executeReorder = async (newOrder: Todo[]) => {
        // Optimistically update UI
        setLocal(newOrder);

        const orderedIds = newOrder.map((t) => t.id);

        try {
            // Send new order to server
            await reorderTodos({ listId, orderedIds }).unwrap();
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

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={local.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
            >
                <ul className="tasklist">
                    {local.map((task, index) => (
                        <SortableTaskItem
                            tasks={tasks}
                            key={task.id}
                            task={task}
                            isFirst={index === 0}
                            isLast={index === local.length - 1}
                            onMove={handleManualMove}
                        />
                    ))}
                </ul>
            </SortableContext>
        </DndContext>
    );
}

// ... (SortableTaskItem remains exactly the same as the previous correct version)
type SortableTaskItemProps = {
    task: Todo;
    tasks: Todo[] | undefined;
    isFirst: boolean;
    isLast: boolean;
    onMove: (id: number, direction: 'up' | 'down') => void;
};

function SortableTaskItem({ task, tasks, isFirst, isLast, onMove }: SortableTaskItemProps) {
    const isSmall = useIsSmallScreen();
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });
    const { data: user } = useAuthenticateQuery();

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
    };

    return (
        <li ref={setNodeRef} style={style} className="task">
            <div className="task-row">
                <div className="task-row-left">
                    {tasks && !isSmall && tasks?.length > 1 && (
                        <span
                            className="drag-handle"
                            ref={setActivatorNodeRef}
                            {...listeners}
                            {...attributes}
                            tabIndex={0}
                            style={{ cursor: "grab" }}
                        >
                            <DragIndicatorIcon />
                        </span>
                    )}
                    <HouseholdTasklistPageTask taskId={task.id} listId={task.listId} householdId={user?.householdId} />
                </div>
                {tasks && isSmall && tasks?.length > 1 && (
                    <div className="task-row-right">
                        <Button
                            variant="subtle"
                            size="xs"
                            color="cyan"
                            disabled={isFirst}
                            onClick={() => onMove(task.id, 'up')}
                        >
                            <ExpandLessRoundedIcon />
                        </Button>
                        <Button
                            variant="subtle"
                            size="xs"
                            color="cyan"
                            disabled={isLast}
                            onClick={() => onMove(task.id, 'down')}
                        >
                            <ExpandMoreRoundedIcon />
                        </Button>
                    </div>
                )}
            </div>
        </li>
    );
}
