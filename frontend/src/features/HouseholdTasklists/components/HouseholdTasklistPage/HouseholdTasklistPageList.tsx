import { useEffect, useMemo, useRef, type SetStateAction } from "react";
import { TaskListDnd } from "./TaskListDnd";
import type { Task, TasklistType } from "@/store/taskSlice"; // Match your import path

type Props = {
    tasklist: TasklistType | undefined;
    tasks?: Task[]; // 👈 NEW: Accept the pre-sorted list
    setShowReorderMode?: React.Dispatch<SetStateAction<boolean>> | undefined;
    showReorderMode?: boolean | undefined;
}

export const HouseholdTasklistPageList = ({ tasklist, tasks, setShowReorderMode, showReorderMode }: Props) => {

    // THE FIX:
    // If 'tasks' is passed from the parent, use it directly (it's already sorted).
    // If NOT passed, fall back to the default behavior (filter by progress + sort by index).
    const displayedTasks = useMemo(() => {
        if (tasks) return tasks;

        // Default logic (only runs if no 'tasks' prop is provided)
        return [...(tasklist?.tasks ?? [])]
            .filter((t) => t.status === "in_progress")
            .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0));
    }, [tasklist, tasks]);

    // Auto-scroll logic
    const tasksEndRef = useRef<HTMLDivElement | null>(null);
    const prevTaskLengthRef = useRef<number>(0);

    const scrollToBottom = () => {
        tasksEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        if (displayedTasks.length > prevTaskLengthRef.current) {
            scrollToBottom();
        }
        prevTaskLengthRef.current = displayedTasks.length;
    }, [displayedTasks]);

    return (
        <div className='household-tasklist-page-list panel tasklist-panel'>
            <div className="household-tasklist-page-tasks panel-body">
                {/* Pass 'displayedTasks' to the DND component */}
                {tasklist && <TaskListDnd tasks={displayedTasks} listId={tasklist.id} showReorderMode={showReorderMode} setShowReorderMode={setShowReorderMode} />}
                <div ref={tasksEndRef} />
            </div>
        </div>
    );
}
