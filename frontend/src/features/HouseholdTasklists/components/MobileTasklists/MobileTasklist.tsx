import { MobileLayout } from "@/layout/MobileLayout";
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Group, Progress, Stack, Text } from "@mantine/core";
import { useGetTasklistQuery } from "@/store/taskSlice" // Checked import path
import { skipToken } from "@reduxjs/toolkit/query";
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { MobileTasklistHeader } from "./MobileTasklistHeader";
import { HouseholdTasklistPageList } from "../HouseholdTasklistPage/HouseholdTasklistPageList";
import { HouseholdTasklistPageCompleted } from "../HouseholdTasklistPage/HouseholdTasklistPageCompleted";
import { HouseholdTasklistPageAddTask } from "../HouseholdTasklistPage/HouseholdTasklistPageAddTask";
import { useTaskFiltering, type SortOption, type TaskFilters } from "../../hooks/useTasklistFiltering";
import "../../styles/MobileTasklist.css";
import { TasklistSettings } from "../TasklistSettings/TasklistSettings";
import { useIsSmallScreen } from "@/hooks/useIsSmallScreen";

export const MobileTasklist = () => {
    const isSmall = useIsSmallScreen();
    const inputRef = useRef<HTMLInputElement>(null);

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

    const { data: tasklist, isFetching } = useGetTasklistQuery(listId ?? skipToken);

    // 3. Derived Data (Safe to run even if tasklist is undefined)
    const tasks = tasklist?.tasks ?? [];

    const completed = useMemo(() =>
        tasks.filter((task) => task.status === "completed"),
        [tasks]);

    // Capture everything NOT completed (pending + in_progress)
    const uncompleted = useMemo(() =>
        tasks.filter((task) => task.status !== "completed"),
        [tasks]);

    // 4. Custom Filter Hook (Must run every render)
    const filteredTasks = useTaskFiltering(
        uncompleted,
        searchValue,
        sortOption,
        filters
    );

    const filteredCompleted = useTaskFiltering(completed, searchValue, sortOption, filters);

    // Progress Bar Logic
    const { percent } = useMemo(() => {
        const total = tasks.length;
        const done = completed.length;
        const raw = total ? (done / total) * 100 : 0;
        return { percent: Math.min(100, Math.max(0, Math.round(raw))) };
    }, [tasks.length, completed.length]);

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
                tasks={tasks}
            />

            <div className="mobile-tasklist-content">
                {filteredTasks.length === 0 && uncompleted.length === 0 && completed.length === 0 &&
                    <Stack justify="center" align="center" my={isSmall ? "5rem" : ""} h={!isSmall ? "100%" : ""}>
                        <Group w="100%" justify="center" align="center">
                            <Text styles={{ root: { lineHeight: "1.4" } }}>This tasklist contains no tasks. Would you like to add one?</Text>
                        </Group>
                        <Button color="cyan" onClick={() => inputRef.current?.focus()}>Add Task</Button>
                    </Stack>
                }
                {/* Active Tasks List */}
                {filteredTasks && filteredTasks.length > 0 ? (
                    <HouseholdTasklistPageList
                        tasklist={tasklist}
                        tasks={filteredTasks} // <--- Passing the filtered list explicitly
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
                <HouseholdTasklistPageAddTask inputRef={inputRef} listId={tasklist.id} />
            </div>

            {showTasklistSettings && <TasklistSettings opened={showTasklistSettings} setShowTasklistSettings={setShowTasklistSettings} />}
        </MobileLayout>
    );
};
