// src/components/TaskListDnd.tsx
import React, { useEffect, useState, type SetStateAction } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useGetTasklistQuery, useGetTaskQuery, useToggleTaskImportanceMutation, type Task } from "@/store/taskSlice";
import { HouseholdTasklistPageTask } from "./HouseholdTasklistPageTask";
import { useAuthenticateQuery } from "@/store/authSlice";
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useIsSmallScreen } from "@/hooks/useIsSmallScreen";
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { Button } from "@mantine/core";
import { StarIcon, StarIconOutline } from "@/assets/icons/StarIcon";
import { TaskDetails } from "./TaskDetails";
import { useTasklist } from "../../hooks/useTasklist";

type Props = {
    listId: number;
    tasks: Task[];
    showReorderMode?: boolean | undefined;
    setShowReorderMode?: React.Dispatch<SetStateAction<boolean>> | undefined;
};

export function TaskListDnd({ listId, tasks, showReorderMode, setShowReorderMode }: Props) {
    const { sensors, handleDragEnd, handleManualMove, local, } = useTasklist({ listId, tasks });

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
                            listId={listId}
                            key={task.id}
                            task={task}
                            isFirst={index === 0}
                            isLast={index === local.length - 1}
                            onMove={handleManualMove}
                            showReorderMode={showReorderMode}
                            setShowReorderMode={setShowReorderMode}
                        />
                    ))}
                </ul>
            </SortableContext>
        </DndContext>
    );
}

type SortableTaskItemProps = {
    task: Task;
    tasks: Task[] | undefined;
    isFirst: boolean;
    isLast: boolean;
    onMove: (id: number, direction: 'up' | 'down') => void;
    listId: number;
    showReorderMode?: boolean | undefined;
    setShowReorderMode?: React.Dispatch<SetStateAction<boolean>> | undefined;
};

function SortableTaskItem({ task: initialTask, tasks, isFirst, isLast, onMove, listId, showReorderMode }: SortableTaskItemProps) {
    const [showTaskDetails, setShowTaskDetails] = useState(false);
    const { data: latestTask } = useGetTaskQuery(initialTask.id);
    const task = latestTask ?? initialTask;
    const isSmall = useIsSmallScreen();
    const { data: tasklist } = useGetTasklistQuery(listId);
    const [viewMode, setViewMode] = useState(tasklist?.viewMode);

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
    const [toggleImportance] = useToggleTaskImportanceMutation();

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
    };

    useEffect(() => {
        if (tasklist?.viewMode) {
            setViewMode(tasklist.viewMode);
        }
    }, [tasklist?.viewMode])

    const handleStarClick = async (e: React.MouseEvent<HTMLDivElement>) => {
        if (tasklist?.isArchived) return;
        e.stopPropagation();
        await toggleImportance({ taskId: task.id, listId: listId, householdId: user?.householdId })
    }

    const handleMoveTaskUp = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (tasklist?.isArchived) return;
        e.stopPropagation();
        onMove(task.id, "up")
    }

    const handleMoveTaskDown = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (tasklist?.isArchived) return;
        e.stopPropagation();
        onMove(task.id, "down");
    }

    return (
        <li ref={setNodeRef} style={style} className={`task${viewMode === "compact" ? " task-no-padding" : ""}${tasklist?.isArchived ? " not-allowed" : " cursored"}`}>
            <div className="task-row" onClick={() => { if (!tasklist?.isArchived) setShowTaskDetails(true) }}>
                <div className="task-row-left">
                    {tasks && !isSmall && tasks?.length > 1 && (
                        <span
                            className="drag-handle"
                            ref={setActivatorNodeRef}
                            // 🚀 ONLY SPREAD LISTENERS IF NOT ARCHIVED
                            {...(!tasklist?.isArchived ? listeners : {})}
                            {...(!tasklist?.isArchived ? attributes : {})}
                            tabIndex={tasklist?.isArchived ? -1 : 0}
                            style={{
                                cursor: tasklist?.isArchived ? "default" : "grab",
                                opacity: tasklist?.isArchived ? 0.3 : 1, // Optional: dim it to show it's disabled
                            }}
                        >
                            <DragIndicatorIcon fontSize="small" />
                        </span>
                    )}
                    <HouseholdTasklistPageTask taskId={task.id} listId={task.listId} householdId={user?.householdId} />
                </div>

                <div className="task-row-right">
                    <div
                        className="star-icon-container"
                        onClick={handleStarClick}
                    >
                        {task?.isImportant ? <StarIcon size={24} /> : <StarIconOutline size={24} />}
                    </div>
                    {showReorderMode && tasks && isSmall && tasks?.length > 1 && (<div className={`task-row-move-btns show-task-btns`}>
                        <Button
                            variant="subtle"
                            size="xs"
                            color="var(--tasklist-color)"
                            disabled={isFirst}
                            onClick={handleMoveTaskUp}
                        >
                            <ExpandLessRoundedIcon />
                        </Button>
                        <Button
                            variant="subtle"
                            size="xs"
                            color="var(--tasklist-color)"
                            disabled={isLast}
                            onClick={handleMoveTaskDown}
                        >
                            <ExpandMoreRoundedIcon />
                        </Button>
                    </div>)}
                </div>

            </div>
            {showTaskDetails && <TaskDetails opened={showTaskDetails} close={() => setShowTaskDetails(false)} taskId={task.id} listId={listId} householdId={user?.householdId} />}
        </li>
    );
}
