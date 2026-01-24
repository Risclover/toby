import { MobileLayout } from "@/layout/MobileLayout";
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ActionIcon, Button, Group, Progress, Stack, Text, Tooltip } from "@mantine/core";
import { useGetTasklistQuery, type TasklistType } from "@/store/taskSlice" // Checked import path
import { skipToken } from "@reduxjs/toolkit/query";
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { MobileTasklistHeader } from "./MobileTasklistHeader";
import { HouseholdTasklistPageList } from "../HouseholdTasklistPage/HouseholdTasklistPageList";
import { HouseholdTasklistPageCompleted } from "../HouseholdTasklistPage/HouseholdTasklistPageCompleted";
import { HouseholdTasklistPageAddTask } from "../HouseholdTasklistPage/HouseholdTasklistPageAddTask";
import { useTaskFiltering, type SortOption, type TaskFilters } from "../../hooks/useTasklistFiltering";
import { TasklistSettings } from "../TasklistSettings/TasklistSettings";
import { useIsSmallScreen } from "@/hooks/useIsSmallScreen";
import "../../styles/MobileTasklist.css";

export const MobileTasklist = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const { tasklistId } = useParams();

    const listId = tasklistId ? Number(tasklistId) : undefined;

    const isSmall = useIsSmallScreen();
    const { data: tasklist, isFetching } = useGetTasklistQuery(listId ?? skipToken);

    const [showCompleted, setShowCompleted] = useState(false);
    const [showTasklistSettings, setShowTasklistSettings] = useState(false);
    const [showReorderMode, setShowReorderMode] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [sortOption, setSortOption] = useState<SortOption | string>(tasklist?.defaultSortOrder ?? "");
    const [filters, setFilters] = useState<TaskFilters>({
        importance: "all",
        assignedToId: null,
        time: "all",
    });

    useEffect(() => {
        if (tasklist?.defaultSortOrder) {
            // Only set it if the user hasn't already picked something else? 
            // Or strictly enforce it on load? usually strictly enforce on load.
            setSortOption(tasklist.defaultSortOrder as SortOption);
        }
    }, [tasklist?.defaultSortOrder]); // Run when the list config loads/changes

    useEffect(() => {
        if (!tasklist) return;
        document.documentElement.style.setProperty("--tasklist-color", tasklist.color);
    }, [tasklist?.color])

    console.log('tasklist color:', tasklist?.color);

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

    useEffect(() => {
        if (tasklist?.showCompleted !== undefined) {
            setShowCompleted(tasklist.showCompleted);
        }
    }, [tasklist?.showCompleted]);

    // 5. Early Returns (Loading / Error States)
    // Safe to return here because all hooks have been called above
    if (!listId) return <div>Invalid list id.</div>;
    if (isFetching && !tasklist) return <div>Loading…</div>;
    if (!tasklist) return <div>Task list not found.</div>;

    return (
        <MobileLayout titleComponent={<TitleComponent percent={percent} setShowTasklistSettings={setShowTasklistSettings} tasklist={tasklist} />}>
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
                filteredTasks={filteredTasks}
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
                {filteredCompleted.length > 0 && completed && completed.length > 0 && (
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

const TitleComponent = ({ percent, tasklist, setShowTasklistSettings }: { percent: number, tasklist: TasklistType, setShowTasklistSettings: (val: boolean) => void }) => {
    const navigate = useNavigate();
    return (
        <div className="mobile-tasklist-title-bar">
            <div className="mobile-tasklist-title-bar-top">
                <div className="title-announcements tasklist-announcements">
                    <Tooltip label="Go back">
                        <ActionIcon onClick={() => navigate(-1)} variant="subtle" color="white">
                            <ChevronLeftRoundedIcon />
                        </ActionIcon></Tooltip>
                    <span className="title-announcements-title">{tasklist.title}</span>
                </div>
                <Tooltip label="Tasklist settings">
                    <ActionIcon
                        onClick={() => setShowTasklistSettings(true)}
                        className="tasklist-settings-btn"
                        size="compact-md"
                        variant="transparent"
                        color="white"
                    >
                        <SettingsRoundedIcon />
                    </ActionIcon>
                </Tooltip>
            </div>
            <div className="progress">
                <div className="progress-left">
                    <Progress color="var(--tasklist-color)" value={percent} />
                </div>
                {percent}%
            </div>
        </div>
    )
}