import { useEffect, useMemo, useRef } from "react";
import { TaskListDnd } from "./TaskListDnd";
import type { TodoListType } from "@/store/todoSlice";

type Props = {
    tasklist: TodoListType | undefined
}

export const HouseholdTasklistPageList = ({ tasklist }: Props) => {
    const uncompleted = useMemo(
        () =>
            [...tasklist?.todos as any[]]
                .filter((t) => t.status === "in_progress")
                .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0)),
        [tasklist?.todos]
    );

    const tasksEndRef = useRef<HTMLDivElement | null>(null);
    const prevTaskLengthRef = useRef<number>(0);

    const scrollToBottom = () => {
        tasksEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        // ONLY scroll if the new length is greater than the previous length
        if (uncompleted.length > prevTaskLengthRef.current) {
            scrollToBottom();
        }

        // Always update the ref to the current length after checking
        prevTaskLengthRef.current = uncompleted.length;
    }, [uncompleted]);

    return <div className='household-tasklist-page-list panel tasklist-panel'>
        <div className="household-tasklist-page-tasks panel-body">
            {tasklist && <TaskListDnd tasks={uncompleted} listId={tasklist.id} />}
            <div ref={tasksEndRef} />
        </div>
    </div>
}