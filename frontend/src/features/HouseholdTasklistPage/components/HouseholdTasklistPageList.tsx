import { useMemo } from "react";
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

    return <div className='household-tasklist-page-list'>
        <div className="household-tasklist-page-tasks">
            {tasklist && <TaskListDnd tasks={uncompleted} listId={tasklist.id} />}
        </div>
    </div >
}