import React, { useState } from "react";
import { HouseholdTasklistPageTask } from "./HouseholdTasklistPageTask"
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import { useAuthenticateQuery } from "@/store/authSlice";
import type { TodoListType } from "@/store/todoSlice";

type Props = {
    tasklist: TodoListType | undefined
    completed: TodoListType[]
    showCompleted: boolean;
    setShowCompleted: React.Dispatch<React.SetStateAction<boolean>>;
}

export const HouseholdTasklistPageCompleted = ({ tasklist, completed, showCompleted, setShowCompleted }: Props) => {
    const { data: user } = useAuthenticateQuery();

    return <div className='household-tasklist-page-completed panel completed-panel'>
        <div
            className="household-tasklist-page-completed-title panel-header"
            onClick={() => setShowCompleted(prev => !prev)}
            title="Click to show"
        >
            <h2>{showCompleted ? "Hide completed" : `Completed (${completed.length})`}</h2>
            {showCompleted ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
        </div>
        {showCompleted && <div className="panel-body">
            {tasklist && completed.map((todo) => (
                <HouseholdTasklistPageTask
                    key={todo.id}                    // <-- add key
                    householdId={user?.householdId}  // can be optional in child
                    listId={tasklist.id}             // <-- guaranteed number here
                    taskId={todo.id}
                />
            ))}
        </div>}
    </div>
}