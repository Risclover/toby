import { useState } from "react";
import { HouseholdTasklistPageTask } from "./HouseholdTasklistPageTask";
import { TaskDetails } from "./TaskDetails";
import type { Task } from "@/store/taskSlice";

type Props = {
    task: Task;
    householdId: number;
    listId: number;
    taskId: number;
}

export const HouseholdTasklistPageCompletedTask = ({ task, householdId, listId }: Props) => {
    const [showTaskDetails, setShowTaskDetails] = useState(false);
    return (
        <div className="completed-task">
            <div onClick={() => setShowTaskDetails(true)}>
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
