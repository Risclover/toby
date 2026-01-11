import { MobileLayout } from "@/layout/MobileLayout";
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Progress } from "@mantine/core";
import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetTodoListQuery, useUpdateTodoListMutation } from "@/store/todoSlice"; // Checked import path
import { skipToken } from "@reduxjs/toolkit/query";
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import "../../styles/MobileTasklist.css";
import { MobileTasklistHeader } from "./MobileTasklistHeader";
import { HouseholdTasklistPageList } from "../HouseholdTasklistPage/HouseholdTasklistPageList";
import { HouseholdTasklistPageCompleted } from "../HouseholdTasklistPage/HouseholdTasklistPageCompleted";
import { HouseholdTasklistPageAddTask } from "../HouseholdTasklistPage/HouseholdTasklistPageAddTask";
import { useTaskFiltering, type SortOption, type TaskFilters } from "../../hooks/useTasklistFiltering";

export const MobileTasklist = () => {
    // 1. UI State Hooks
    const [showCompleted, setShowCompleted] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [sortOption, setSortOption] = useState<SortOption>("");
    const [filters, setFilters] = useState<TaskFilters>({
        importance: "all",
        assignedToId: null,
        time: "all",
    });

    // 2. Navigation & Data Hooks
    const navigate = useNavigate();
    const { tasklistId } = useParams();
    const listId = tasklistId ? Number(tasklistId) : undefined;

    const { data: user } = useAuthenticateQuery();
    const { data: tasklist, isFetching } = useGetTodoListQuery(listId ?? skipToken);
    const [updateTodoListTitle] = useUpdateTodoListMutation();

    // 3. Derived Data (Safe to run even if tasklist is undefined)
    const todos = tasklist?.todos ?? [];

    const completed = useMemo(() =>
        todos.filter((todo) => todo.status === "completed"),
        [todos]);

    // Capture everything NOT completed (pending + in_progress)
    const uncompleted = useMemo(() =>
        todos.filter((todo) => todo.status !== "completed"),
        [todos]);

    // 4. Custom Filter Hook (Must run every render)
    const filteredTodos = useTaskFiltering(
        uncompleted,
        searchValue,
        sortOption,
        filters
    );

    // Progress Bar Logic
    const { percent } = useMemo(() => {
        const total = todos.length;
        const done = completed.length;
        const raw = total ? (done / total) * 100 : 0;
        return { percent: Math.min(100, Math.max(0, Math.round(raw))) };
    }, [todos.length, completed.length]);

    // 5. Early Returns (Loading / Error States)
    // Safe to return here because all hooks have been called above
    if (!listId) return <div>Invalid list id.</div>;
    if (isFetching && !tasklist) return <div>Loading…</div>;
    if (!tasklist) return <div>Task list not found.</div>;

    // 6. Components
    const titleComponent = (
        <div className="mobile-tasklist-title-bar">
            <div className="mobile-tasklist-title-bar-top">
                <div className="title-announcements">
                    <Button
                        size="compact-xs"
                        radius="xl"
                        variant="subtle"
                        color="white"
                        onClick={() => navigate(-1)}
                    >
                        <ChevronLeftRoundedIcon />
                    </Button>
                    {tasklist.title}
                </div>
                <Button
                    className="tasklist-settings-btn"
                    size="compact-md"
                    variant="transparent"
                    color="white"
                    w={30}
                    h={30}
                    p={0}
                >
                    <SettingsRoundedIcon />
                </Button>
            </div>
            <div className="progress">
                <div className="progress-left">
                    <Progress color="cyan" value={percent} />
                </div>
                {percent}%
            </div>
        </div>
    );

    return (
        <MobileLayout titleComponent={titleComponent}>
            <MobileTasklistHeader
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                sortOption={sortOption}
                setSortOption={setSortOption}
                filters={filters}
                setFilters={setFilters}
            />

            <div className="mobile-tasklist-content">
                {/* Active Tasks List */}
                {filteredTodos && filteredTodos.length > 0 ? (
                    <HouseholdTasklistPageList
                        tasklist={tasklist}
                        tasks={filteredTodos} // <--- Passing the filtered list explicitly
                    />
                ) : (
                    // Empty state when filters hide everything
                    uncompleted.length > 0 && (
                        <div style={{
                            padding: '2rem',
                            textAlign: 'center',
                            opacity: 0.5,
                            fontSize: '0.9rem'
                        }}>
                            No tasks match your filters
                        </div>
                    )
                )}

                {/* Completed Tasks Section */}
                {completed && completed.length > 0 && (
                    <HouseholdTasklistPageCompleted
                        tasklist={tasklist}
                        completed={completed}
                        showCompleted={showCompleted}
                        setShowCompleted={setShowCompleted}
                    />
                )}
            </div>

            {/* Input Bar */}
            <div className="mobile-tasklist-input">
                <HouseholdTasklistPageAddTask listId={tasklist.id} />
            </div>
        </MobileLayout>
    );
};
