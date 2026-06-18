import React, { useRef } from "react";
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import { useAuthenticateQuery } from "@/store/authSlice";
import type { Task, TasklistType } from "@/store/taskSlice";
import { HouseholdTasklistPageCompletedTask } from "./HouseholdTasklistPageCompletedTask";
import { HomepageCollapseCardTitle } from "@/components/HomepageCollapseCard/HomepageCollapseCardTitle";
import { HomepageCollapseCard } from "@/components/HomepageCollapseCard/HomepageCollapseCard";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
    tasklist: TasklistType | undefined
    completed: Task[]
    showCompleted: boolean | undefined;
    setShowCompleted: React.Dispatch<React.SetStateAction<boolean | undefined>>;
}


export const HouseholdTasklistPageCompleted = ({ tasklist, completed, showCompleted, setShowCompleted }: Props) => {
    const { data: user } = useAuthenticateQuery();
    const prevIds = useRef<Set<number>>(new Set());
    if (!tasklist) return null;
    return (
        <HomepageCollapseCard title="completed" color={tasklist.color} cardKey={`tasklist-completed-${tasklist.id}`}>
            <div className="panel-body">
                {completed.map((task) => {
                    return (

                        <HouseholdTasklistPageCompletedTask
                            task={task}
                            householdId={user?.householdId}
                            listId={tasklist.id}
                            taskId={task.id}
                            tasklist={tasklist}
                        />
                    );
                })}
            </div>

        </HomepageCollapseCard >
    );
}