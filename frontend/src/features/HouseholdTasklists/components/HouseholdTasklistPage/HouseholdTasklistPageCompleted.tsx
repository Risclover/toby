import React from "react";
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import { useAuthenticateQuery } from "@/store/authSlice";
import type { Task, TasklistType } from "@/store/taskSlice";
import { HouseholdTasklistPageCompletedTask } from "./HouseholdTasklistPageCompletedTask";
import { HomepageCollapseCardTitle } from "@/components/HomepageCollapseCard/HomepageCollapseCardTitle";
import { HomepageCollapseCard } from "@/components/HomepageCollapseCard/HomepageCollapseCard";

type Props = {
    tasklist: TasklistType | undefined
    completed: Task[]
    showCompleted: boolean;
    setShowCompleted: React.Dispatch<React.SetStateAction<boolean>>;
}

export const HouseholdTasklistPageCompleted = ({ tasklist, completed, showCompleted, setShowCompleted }: Props) => {
    const { data: user } = useAuthenticateQuery();

    if (!tasklist) return null;
    return (
        <HomepageCollapseCard title="completed" color={tasklist.color} cardKey={`tasklist-completed-${tasklist.id}`}>
            <div
                className="homepage-collapse-card-title"
                onClick={(e) => { e.stopPropagation(); setShowCompleted((prev) => !prev) }}
                onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") setShowCompleted(prev => !prev) }}
                title="Click to show"
                tabIndex={0}
            >
                {showCompleted ? "Hide completed" : `Completed (${completed.length})`}
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
                        tasklist={tasklist}
                    />
                ))}
            </div>}
        </HomepageCollapseCard>
    )
}