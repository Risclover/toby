import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetTasklistQuery, useUpdateTasklistMutation } from "@/store/taskSlice";
import { Progress } from "@mantine/core";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query"; // <-- use this
import { HouseholdTasklistPageAddTask } from "./HouseholdTasklistPageAddTask";
import { EditableTitle } from "../../../../component/EditableTitle";
import { HouseholdTasklistPageList } from "./HouseholdTasklistPageList";
import { HouseholdTasklistPageCompleted } from "./HouseholdTasklistPageCompleted";
import "../../styles/HouseholdTasklistPage.css";

export const HouseholdTasklistPage = () => {
    const { tasklistId } = useParams();
    const navigate = useNavigate();

    const listId = tasklistId ? Number(tasklistId) : undefined;

    const { data: user } = useAuthenticateQuery();
    // Don't fetch with NaN/undefined
    const { data: tasklist, isFetching } = useGetTasklistQuery(listId ?? skipToken);
    const [updateTasklistTitle] = useUpdateTasklistMutation();

    const [showCompleted, setShowCompleted] = useState(tasklist?.showCompleted);
    const tasks = tasklist?.tasks ?? [];

    const { percent } = useMemo(() => {
        const total = tasks.length;
        const done = tasks.filter((t) => t.status === "completed").length;
        const raw = total ? (done / total) * 100 : 0;
        const percent = Math.min(100, Math.max(0, Math.round(raw)));
        return { percent };
    }, [tasks]);

    const handleUpdateTitle = async (next: string) => {
        if (!tasklist) return; // guard
        await updateTasklistTitle({ listId: tasklist.id, title: next, householdId: user?.householdId }).unwrap();
    };

    if (!listId) return <div>Invalid list id.</div>;
    if (isFetching && !tasklist) return <div>Loading…</div>;

    const completed = tasklist?.tasks?.filter((task) => task.status === "completed")
    const uncompleted = tasklist?.tasks?.filter((task) => task.status === "in_progress")

    return (
        <div className={`household-tasklist-page tasklists-shell ${showCompleted ? 'completed-open' : 'completed-collapsed'}`}>
            <header>
                <div onClick={() => navigate(-1)}>&lt; Back</div>

                <div className="household-tasklist-page-title shell-header">
                    <EditableTitle
                        title={tasklist?.title ?? ""}   // <-- always a string
                        onSave={handleUpdateTitle}
                    />
                </div>

                <div className="household-tasklist-page-progress">
                    <div className="progress-left">
                        <Progress color="cyan" value={percent} />
                    </div>
                    {percent}%
                </div>
            </header>
            <div className="sections">
                {uncompleted && uncompleted.length > 0 &&
                    <HouseholdTasklistPageList
                        tasklist={tasklist}
                    />
                }
                {completed && completed?.length > 0 &&
                    <HouseholdTasklistPageCompleted
                        tasklist={tasklist}
                        completed={completed}
                        showCompleted={showCompleted}
                        setShowCompleted={setShowCompleted}
                    />
                }
            </div>
            <HouseholdTasklistPageAddTask listId={tasklist?.id} /> {/* number, not undefined */}
        </div >
    );
};
