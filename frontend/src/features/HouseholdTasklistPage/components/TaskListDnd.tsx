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

type Props = {
    listId: number;
    tasks: Todo[]; // fetched via RTK Query
};

export function TaskListDnd({ listId, tasks }: Props) {
    // Keep a local sorted copy for instant UI moves
    const initial = useMemo(
        () => [...tasks].sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0)),
        [tasks]
    );
    const [local, setLocal] = useState<Todo[]>(initial);

    useEffect(() => {
        const a = initial.map(t => t.id).join(",");
        const b = local.map(t => t.id).join(",");
        if (a !== b) setLocal(initial);
    }, [initial, local]);

    const [reorderTodos] = useReorderTodosMutation();

    const sensors = useSensors(
        // Require a small pointer movement to avoid accidental drags from clicks
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = local.findIndex((t) => t.id === Number(active.id));
        const newIndex = local.findIndex((t) => t.id === Number(over.id));
        if (oldIndex === -1 || newIndex === -1) return;

        const next = arrayMove(local, oldIndex, newIndex);
        setLocal(next); // optimistic UI

        const orderedIds = next.map((t) => t.id);
        try {
            await reorderTodos({ listId, orderedIds }).unwrap();
            // list query invalidates/refetches elsewhere
        } catch {
            // rollback on failure
            setLocal(local);
        }
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
                    {local.map((task) => (
                        <SortableTaskItem key={task.id} task={task} />
                    ))}
                </ul>
            </SortableContext>
        </DndContext>
    );
}

function SortableTaskItem({ task }: { task: Todo }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef, // IMPORTANT: use this for the handle
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });
    const { data: user } = useAuthenticateQuery()

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        userSelect: "none",
    };

    return (
        <li ref={setNodeRef} style={style} className="task">
            <div className="task-row">
                {/* Drag handle — the ONLY activator */}
                <span
                    className="drag-handle"
                    ref={setActivatorNodeRef}
                    {...listeners}
                    {...attributes}
                    tabIndex={0}
                    aria-label="Drag handle"
                    style={{ cursor: "grab" }}
                >
                    <DragIndicatorIcon />
                </span>

                <HouseholdTasklistPageTask task={task} listId={task.listId} householdId={user?.householdId} />
                {/* right-side actions, due date, etc. */}
            </div>
        </li>
    );
}
