import { MobileLayout } from "@/layout/MobileLayout";
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Progress } from "@mantine/core";
import { useGetTodoListQuery } from "@/store/todoSlice"; // Checked import path
import { skipToken } from "@reduxjs/toolkit/query";
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { MobileTasklistHeader } from "./MobileTasklistHeader";
import { HouseholdTasklistPageList } from "../HouseholdTasklistPage/HouseholdTasklistPageList";
import { HouseholdTasklistPageCompleted } from "../HouseholdTasklistPage/HouseholdTasklistPageCompleted";
import { HouseholdTasklistPageAddTask } from "../HouseholdTasklistPage/HouseholdTasklistPageAddTask";
import { useTaskFiltering, type SortOption, type TaskFilters } from "../../hooks/useTasklistFiltering";
import "../../styles/MobileTasklist.css";
import { TasklistSettings } from "../HouseholdTasklistPage/TasklistSettings";
import { MobileTasklistHeaderCompact } from "./MobileTasklistHeaderCompact";

export const MobileTasklist = () => {
    const [showCompleted, setShowCompleted] = useState(false);
    const [showTasklistSettings, setShowTasklistSettings] = useState(false);
    const [showReorderMode, setShowReorderMode] = useState(false);
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

    const { data: tasklist, isFetching } = useGetTodoListQuery(listId ?? skipToken);

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

    const filteredCompleted = useTaskFiltering(completed, searchValue, sortOption, filters);

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
                <div className="title-announcements tasklist-announcements">
                    <Button
                        size="compact-xs"
                        radius="xl"
                        variant="subtle"
                        color="white"
                        onClick={() => navigate(-1)}
                    >
                        <ChevronLeftRoundedIcon />
                    </Button>
                    <span className="title-announcements-title">{tasklist.title}</span>
                </div>
                <Button
                    className="tasklist-settings-btn"
                    size="compact-md"
                    variant="transparent"
                    color="white"
                    w={30}
                    h={30}
                    p={0}
                    onClick={() => setShowTasklistSettings(true)}
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
                showReorderMode={showReorderMode}
                setShowReorderMode={setShowReorderMode}
            />

            <div className="mobile-tasklist-content">
                {/* Active Tasks List */}
                {filteredTodos && filteredTodos.length > 0 ? (
                    <HouseholdTasklistPageList
                        tasklist={tasklist}
                        tasks={filteredTodos} // <--- Passing the filtered list explicitly
                        showReorderMode={showReorderMode}
                        setShowReorderMode={setShowReorderMode}
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
                            No tasks match your filters.
                        </div>
                    )
                )}

                {/* Completed Tasks Section */}
                {completed && completed.length > 0 && (
                    <HouseholdTasklistPageCompleted
                        tasklist={tasklist}
                        completed={filteredCompleted}
                        showCompleted={showCompleted}
                        setShowCompleted={setShowCompleted}
                    />
                )}
            </div>

            {/* Input Bar */}
            <div className="mobile-tasklist-input">
                <HouseholdTasklistPageAddTask listId={tasklist.id} />
            </div>

            {showTasklistSettings && <TasklistSettings opened={showTasklistSettings} handleClose={() => setShowTasklistSettings(false)} />}
        </MobileLayout>
    );
};
