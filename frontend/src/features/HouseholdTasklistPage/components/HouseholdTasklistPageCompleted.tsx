import { useState } from "react";
import { HouseholdTasklistPageTask } from "./HouseholdTasklistPageTask"
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import { useAuthenticateQuery } from "@/store/authSlice";
import type { TodoListType } from "@/store/todoSlice";

type Props = {
    tasklist: TodoListType | undefined
    completed: TodoListType[]
}

export const HouseholdTasklistPageCompleted = ({ tasklist, completed }: Props) => {
    const [showCompleted, setShowCompleted] = useState(false);
    const { data: user } = useAuthenticateQuery();

    return <div className='household-tasklist-page-completed'>
        <div
            className="household-tasklist-page-completed-title"
            onClick={() => setShowCompleted(prev => !prev)}
            title="Click to show"
        >
            <h2>{showCompleted ? "Hide completed" : `Completed (${completed.length})`}</h2>
            {showCompleted ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
        </div>
        {showCompleted && <div className="household-tasklist-page-tasks">
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