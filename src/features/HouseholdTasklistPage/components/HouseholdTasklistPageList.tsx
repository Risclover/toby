import { useState } from "react";
import { useAuthenticateQuery } from "@/store/authSlice";
import { HouseholdTasklistPageTask } from "./HouseholdTasklistPageTask"
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';

export const HouseholdTasklistPageList = ({ tasklist }) => {
    const [showCompleted, setShowCompleted] = useState(false);

    const { data: user } = useAuthenticateQuery();
    const uncompleted = tasklist.todos.filter(todo => todo.status === 'in_progress')
    const completed = tasklist.todos.filter((todo) => todo.status === "completed")

    return <div className='household-tasklist-page-list'>
        <div className="household-tasklist-page-tasks">
            {uncompleted.map((todo) => (
                <HouseholdTasklistPageTask
                    key={todo.id}                    // <-- add key
                    householdId={user?.householdId}  // can be optional in child
                    listId={tasklist.id}             // <-- guaranteed number here
                    task={todo}
                />
            ))}
        </div>
        {completed.length > 0 && <div className='household-tasklist-page-completed'>
            <div
                className="household-tasklist-page-completed-title"
                onClick={() => setShowCompleted(prev => !prev)}
                title="Click to show"
            >
                <h2>{showCompleted ? "Hide completed" : `Completed (${completed.length})`}</h2>
                {showCompleted ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
            </div>
            {showCompleted && <div className="household-tasklist-page-tasks">
                {completed.map((todo) => (
                    <HouseholdTasklistPageTask
                        key={todo.id}                    // <-- add key
                        householdId={user?.householdId}  // can be optional in child
                        listId={tasklist.id}             // <-- guaranteed number here
                        task={todo}
                    />
                ))}
            </div>}
        </div>}
    </div >
}