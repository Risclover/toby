import React from "react";
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import { useAuthenticateQuery } from "@/store/authSlice";
import type { Task, TasklistType } from "@/store/taskSlice";
import { HouseholdTasklistPageCompletedTask } from "./HouseholdTasklistPageCompletedTask";

type Props = {
    tasklist: TasklistType | undefined
    completed: Task[]
    showCompleted: boolean | undefined;
    setShowCompleted: React.Dispatch<React.SetStateAction<boolean | undefined>>;
}

export const HouseholdTasklistPageCompleted = ({ tasklist, completed, showCompleted, setShowCompleted }: Props) => {
    const { data: user } = useAuthenticateQuery();

    return (
        <div className='household-tasklist-page-completed panel completed-panel'>
            <div
                className="household-tasklist-page-completed-title panel-header"
                onClick={(e) => { e.stopPropagation(); setShowCompleted((prev) => !prev) }}
                title="Click to show"
            >
                <h2>{showCompleted ? "Hide completed" : `Completed (${completed.length})`}</h2>
                {showCompleted ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
            </div>
            {showCompleted && <div className="panel-body">
                {tasklist && completed.map((task) => (
                    <HouseholdTasklistPageCompletedTask
                        key={task.id}                    // <-- add key
                        task={task}
                        householdId={user?.householdId}  // can be optional in child
                        listId={tasklist.id}             // <-- guaranteed number here
                        taskId={task.id}
                    />
                ))}
            </div>}
        </div>
    )
}