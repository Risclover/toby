import { MobileHeader } from "@/component/MobileHomeHeader"
import { MobileLayout } from "@/layout/MobileLayout"
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { Button } from "@mantine/core";
import { useGetHouseholdQuery, useGetHouseholdTodoListsQuery } from "@/store/householdSlice";
import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetTodoListQuery, useUpdateTodoListMutation } from "@/store/todoSlice";
import { skipToken } from "@reduxjs/toolkit/query";
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import "../../styles/MobileTasklist.css";

export const MobileTasklist = () => {
    const [showCompleted, setShowCompleted] = useState(false);

    const navigate = useNavigate();
    const { tasklistId } = useParams();
    const listId = tasklistId ? Number(tasklistId) : undefined;

    const { data: user } = useAuthenticateQuery();
    const { data: tasklist, isFetching } = useGetTodoListQuery(listId ?? skipToken);
    const [updateTodoListTitle] = useUpdateTodoListMutation();
    const todos = tasklist?.todos ?? [];

    const { percent } = useMemo(() => {
        const total = todos.length;
        const done = todos.filter((t) => t.status === "completed").length;
        const raw = total ? (done / total) * 100 : 0;
        const percent = Math.min(100, Math.max(0, Math.round(raw)));
        return { percent };
    }, [todos]);

    const handleUpdateTitle = async (next: string) => {
        if (!tasklist) return; // guard
        await updateTodoListTitle({ listId: tasklist.id, title: next, householdId: user?.householdId }).unwrap();
    };

    if (!listId) return <div>Invalid list id.</div>;
    if (isFetching && !tasklist) return <div>Loading…</div>;

    const completed = tasklist?.todos?.filter((todo) => todo.status === "completed")
    const uncompleted = tasklist?.todos?.filter((todo) => todo.status === "in_progress")

    const titleComponent = <div className="mobile-home-family-title">
        <div className="title-announcements">
            <Button size="compact-xs" radius="xl" variant="subtle" color="white" onClick={() => navigate(-1)}><ChevronLeftRoundedIcon /></Button>
            {tasklist?.title}
        </div>
        <Button
            className="tasklist-settings-btn" size="compact-md" variant="transparent" color="white"
            w={30}
            h={30}
            p={0}
        >
            <SettingsRoundedIcon />
        </Button>
    </div >
    return (
        <MobileLayout titleComponent={titleComponent}>
            <div className="mobile-tasklist-content">
                {/* Tasklist content goes here */}
            </div>
        </MobileLayout>
    )
}