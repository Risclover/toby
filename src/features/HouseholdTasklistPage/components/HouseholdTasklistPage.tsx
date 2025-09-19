import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetTodoListQuery, useUpdateTodoListMutation } from "@/store/todoSlice";
import { Progress } from "@mantine/core";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query"; // <-- use this
import "../styles/HouseholdTasklistPage.css";
import { HouseholdTasklistPageTask } from "./HouseholdTasklistPageTask";
import { HouseholdTasklistPageAddTask } from "./HouseholdTasklistPageAddTask";
import { EditableTitle } from "../../../component/EditableTitle";

export const HouseholdTasklistPage = () => {
    const { tasklistId } = useParams();
    const listId = tasklistId ? Number(tasklistId) : undefined;

    const navigate = useNavigate();
    const { data: user } = useAuthenticateQuery();

    // Don't fetch with NaN/undefined
    const { data: tasklist, isFetching } = useGetTodoListQuery(listId ?? skipToken);

    const [updateTodoListTitle] = useUpdateTodoListMutation();

    const todos = tasklist?.todos ?? [];

    const { done, total, percent } = useMemo(() => {
        const total = todos.length;
        const done = todos.filter((t) => t.status === "completed").length;
        const raw = total ? (done / total) * 100 : 0;
        const percent = Math.min(100, Math.max(0, Math.round(raw)));
        return { done, total, percent };
    }, [todos]);

    const handleUpdateTitle = async (next: string) => {
        if (!tasklist) return; // guard
        await updateTodoListTitle({ listId: tasklist.id, title: next, householdId: user?.householdId }).unwrap();
    };

    if (!listId) return <div>Invalid list id.</div>;
    if (isFetching && !tasklist) return <div>Loading…</div>;

    return (
        <div className="household-tasklist-page">
            <div onClick={() => navigate(-1)}>&lt; Back</div>

            <div className="household-tasklist-page-title">
                <EditableTitle
                    title={tasklist?.title ?? ""}   // <-- always a string
                    onSave={handleUpdateTitle}
                    className="household-tasklist-page-title editable-title"
                />
            </div>

            <div className="household-tasklist-page-progress">
                <div className="progress-left">
                    <Progress color="violet" value={percent} />
                </div>
                {percent}%
            </div>

            <div className="household-tasklist-page-tasks">
                {tasklist?.todos?.map((todo) => (
                    <HouseholdTasklistPageTask
                        key={todo.id}                    // <-- add key
                        householdId={user?.householdId}  // can be optional in child
                        listId={tasklist.id}             // <-- guaranteed number here
                        task={todo}
                    />
                ))}
            </div>

            <HouseholdTasklistPageAddTask listId={tasklist?.id} /> {/* number, not undefined */}
        </div>
    );
};
