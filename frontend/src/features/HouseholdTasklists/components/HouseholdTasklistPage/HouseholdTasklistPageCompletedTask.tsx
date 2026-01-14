import { useState } from "react";
import { HouseholdTasklistPageTask } from "./HouseholdTasklistPageTask";
import { TaskDetails } from "./TaskDetails";
import type { TodoListType } from "@/store/todoSlice";

type Props = {
    task: TodoListType;
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
                    showTaskDetails={showTaskDetails}
                    setShowTaskDetails={setShowTaskDetails}
                />
            </div>
            {showTaskDetails && <TaskDetails opened={showTaskDetails} close={() => setShowTaskDetails(false)} taskId={task.id} listId={listId} householdId={householdId} />}
        </div>
    )
}
