import { useState } from "react";
import { HouseholdTasklistPageTask } from "./HouseholdTasklistPageTask";
import { TaskDetails } from "./TaskDetails";
import type { Task, TasklistType } from "@/store/taskSlice";

type Props = {
    task: Task;
    householdId: number;
    listId: number;
    taskId: number;
    tasklist: TasklistType;
}

export const HouseholdTasklistPageCompletedTask = ({ task, tasklist, householdId, listId }: Props) => {
    const [showTaskDetails, setShowTaskDetails] = useState(false);
    return (
        <div className={`completed-task${tasklist?.isArchived ? " not-allowed" : "cursored"}`}>
            <div onClick={() => { if (!tasklist?.isArchived) setShowTaskDetails(true) }}>
                <HouseholdTasklistPageTask
                    key={task.id}                    // <-- add key
                    householdId={householdId}  // can be optional in child
                    listId={listId}             // <-- guaranteed number here
                    taskId={task.id}
                />
            </div>
            {showTaskDetails && <TaskDetails opened={showTaskDetails} close={() => setShowTaskDetails(false)} taskId={task.id} listId={listId} householdId={householdId} />}
        </div>
    )
}
