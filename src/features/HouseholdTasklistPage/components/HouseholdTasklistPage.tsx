import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdTodoListsQuery } from "@/store/householdSlice";
import { useGetTodoListQuery } from "@/store/todoSlice";
import { Progress } from "@mantine/core";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom"
import "../styles/HouseholdTasklistPage.css"
import { HouseholdTasklistPageTask } from "./HouseholdTasklistPageTask";
import { HouseholdTasklistPageAddTask } from "./HouseholdTasklistPageAddTask";

export const HouseholdTasklistPage = () => {
    const { tasklistId } = useParams();
    const navigate = useNavigate();
    const { data: user } = useAuthenticateQuery();
    const { data: tasklist } = useGetTodoListQuery(Number(tasklistId));

    const todos = tasklist?.todos ?? [];

    const { done, total, percent } = useMemo(() => {
        const total = todos.length;
        const done = todos.filter(t => t.status === "completed").length;
        const raw = total ? (done / total) * 100 : 0;
        const percent = Math.min(100, Math.max(0, Math.round(raw)));
        return { done, total, percent };
    }, [todos]);

    return <div className="household-tasklist-page">
        <div onClick={() => navigate(-1)}>&lt; Back</div>
        <div className="household-tasklist-page-title">{tasklist?.title}</div>
        <div className="household-tasklist-page-progress">
            <div className="progress-left">
                <Progress color="violet" value={percent} />
            </div>
            {percent}%
        </div>
        <div className="household-tasklist-page-tasks">{tasklist?.todos?.map((todo) => <HouseholdTasklistPageTask householdId={user?.householdId} listId={tasklist?.id} task={todo} />)}</div>
        <HouseholdTasklistPageAddTask listId={tasklist?.id} />
    </div>
}