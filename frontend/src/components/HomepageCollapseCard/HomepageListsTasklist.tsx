import { useAddTaskMutation, useAuthenticateQuery, useCompleteTaskMutation, useGetTasklistQuery, type Task } from "@/store"
import { useGetFeaturedListSettingsQuery, type FeaturedTasklistSettings } from "@/store/featuredListSettingSlice";
import { ActionIcon, Button, Checkbox, Popover, Progress, ScrollArea, TextInput, Tooltip } from "@mantine/core";
import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import InfoOutlineRoundedIcon from '@mui/icons-material/InfoOutlineRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import HelpRoundedIcon from '@mui/icons-material/HelpRounded';
import { useFeaturedTasks } from "@/hooks/useFeaturedTasks";
import { ExternalLinkIcon } from "@/assets/icons/ExternalLinkIcon";
import { useNavigate } from "react-router-dom";
import { useTasklistStats, useTasklistTheme } from "@/features";
import { TaskExtra } from "@/features/HouseholdTasklists/components/HouseholdTasklistPage";
import type { TasklistSettingsForm } from "@/features/HouseholdTasklists/hooks/useTasklistSettingsForm";
import type { FeaturedTasklistSettingsForm } from "../FeaturedListSettings/FeaturedTasklistTab";
import { StarIcon, StarIconOutline } from "@/assets";
import { MobileTasklistSkeleton } from "@/features/HouseholdTasklists/components/MobileTasklists/MobileTasklistSkeleton";
import { skipToken } from "@reduxjs/toolkit/query";


type TasklistItemProps = {
    task: Task;
    tasklistId: number;
    // We need to know if the parent is currently hiding completed tasks
    hideCompleted: boolean;
    settings: FeaturedTasklistSettings | undefined;
}


export const HomepageListsTasklist = ({ isReady }: { isReady: boolean }) => {
    const inputRef = useRef(null);
    const [taskValue, setTaskValue] = useState("");
    const navigate = useNavigate();
    const { data: user } = useAuthenticateQuery();
    const { data: userSettings, isLoading: isSettingsLoading } = useGetFeaturedListSettingsQuery();

    const [addTask] = useAddTaskMutation();


    let featuredTasklistId = userSettings?.featuredTasklist.tasklistId;


    const { data: tasklist, isLoading: isTasklistLoading } = useGetTasklistQuery(
        featuredTasklistId ?? skipToken  // cleaner than the ternary — explicitly skips
    );

    const displayedTasks = useFeaturedTasks(
        tasklist?.tasks,
        tasklist,
        userSettings?.featuredTasklist,
        user?.id
    );


    const { percent } = useTasklistStats(tasklist?.tasks)


    const showCompleted = userSettings?.featuredTasklist.showCompleted ?? false;
    const hasTasks = (tasklist?.tasks?.length || 0) > 0;
    const allCompleted = hasTasks && (tasklist?.tasks || []).filter(task => task.status === "in_progress").length === 0;
    const isVictoryState = allCompleted && !showCompleted;
    const isEmptyState = displayedTasks && displayedTasks.length === 0;
    const showProgress = userSettings?.featuredTasklist?.showProgress ?? false;
    const showQuickAdd = userSettings?.featuredTasklist?.showQuickAdd ?? false;


    useTasklistTheme(tasklist?.color)


    const handleTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!tasklist?.isArchived)
            setTaskValue(e.target.value)
    }


    const handleAddTask = async () => {
        if (taskValue.trim() === "") return;
        await addTask({ title: taskValue, householdId: user?.householdId, description: "", status: "in_progress", isImportant: false, dueDate: undefined, listId: tasklist?.id })
        setTaskValue("");
        inputRef?.current?.focus();
    }

    if (!isReady) return <MobileTasklistSkeleton />;

    return (
        <div className="homepage-lists-tasklist-container">
            {!featuredTasklistId ?
                (
                    <div className="featured-empty-state">
                        No tasklist featured.
                        <Tooltip
                            events={{ hover: true, focus: true, touch: true }}
                            multiline
                            w={220}
                            radius="md"
                            withArrow
                            transitionProps={{ duration: 200 }}
                            label="Feature a list by clicking the star icon on any tasklist card, or select one in the Featured List Settings."
                        >
                            <Button p={0} h="auto" radius="xl" color="transparent" variant="transparent" className="featured-info-icon">
                                <HelpOutlineRoundedIcon />
                            </Button>
                        </Tooltip></div>
                ) : (
                    <>
                        <div className="featured-tasklist-title">
                            <div className="featured-tasklist-title-top">
                                <span>{tasklist?.title}</span>
                                <Tooltip label="Open tasklist" withArrow openDelay={500}>
                                    <ActionIcon
                                        // onClick={() => setShowTasklistSettings(true)}
                                        size="sm"
                                        variant="transparent"
                                        color="var(--tasklist-color)"
                                        onClick={() => window.open(`/tasklists/${tasklist?.id}`, "_blank")}
                                    >
                                        <ExternalLinkIcon size="1rem" color="var(--tasklist-color)" />
                                    </ActionIcon>
                                </Tooltip>
                            </div>
                            {showProgress && <div className="featured-tasklist-title-progress">
                                <div className="progress-left"><Progress value={percent} color="var(--tasklist-color)" /></div> <span>{percent}%</span>
                            </div>}


                        </div>


                        {/* 2. TASK LIST */}
                        <ul className="homepage-lists-tasklist">
                            {tasklist && displayedTasks?.map(task => (
                                <FeaturedTasklistItem
                                    key={task.id}
                                    task={task}
                                    tasklistId={tasklist.id}
                                    hideCompleted={!showCompleted}
                                    settings={userSettings?.featuredTasklist}
                                />
                            ))}
                        </ul>


                        {/* 3. MUTUALLY EXCLUSIVE EMPTY STATES */}
                        {isVictoryState ? (
                            <div className="featured-empty-state">🏅 All tasks completed! 🏅</div>
                        ) : (
                            isEmptyState && (
                                <div className="featured-empty-state">No matching tasks found.</div>
                            )
                        )}
                        {showQuickAdd &&
                            <div className="featured-tasklist-quick-add">
                                {/* <TextInput radius="md" size="xs" m="5px" placeholder="Add a task" /> */}
                                <div className="featured-tasklist-input-container">
                                    <input disabled={tasklist?.isArchived}
                                        value={taskValue}
                                        // onKeyDown={(e) => { if (e.key === "Enter" && !tasklist?.isArchived) { handleAddTask() } }}
                                        // ref={inputRef}
                                        onKeyDown={(e) => { if (e.key === "Enter") { handleAddTask() } }}
                                        onChange={handleTitle}
                                        id="add-task"
                                        type="text"
                                        placeholder="Add a task and press Enter"
                                        maxLength={255}
                                        ref={inputRef}
                                    />
                                    <Button color="var(--tasklist-color)" fw={500} variant="filled" size="xs" radius="sm" onClick={handleAddTask}>Add</Button>
                                </div>
                            </div>
                        }
                    </>
                )}
        </div>
    );
}


const FeaturedTasklistItem = ({ task, tasklistId, hideCompleted, settings }: TasklistItemProps) => {
    const { data: user } = useAuthenticateQuery();
    const [completeTask] = useCompleteTaskMutation();

    const showDetails = settings?.view === "detailed";

    // 1. Local state to force the checkbox to look checked immediately
    const [isChecked, setIsChecked] = useState(task.status === "completed");

    // 2. Sync local state with props (in case it changes from elsewhere)
    useEffect(() => {
        setIsChecked(task.status === "completed");
    }, [task.status]);


    // 3. Shared Logic for toggling state
    const handleToggle = (nextChecked: boolean) => {
        // Update local UI instantly
        setIsChecked(nextChecked);

        // If we are checking it OFF (completing it) and the list hides completed items,
        // we might want a slight delay before calling the mutation 
        // so the user sees the check animation.
        if (nextChecked && hideCompleted) {
            setTimeout(() => {
                triggerMutation(nextChecked);
            }, 300); // 300ms delay - adjust to match your animation feel
        } else {
            // If unchecking or if completed items are shown, update immediately
            triggerMutation(nextChecked);
        }
    };

    // Handler for the entire ROW click
    const onRowClick = (e: MouseEvent<HTMLLIElement>) => {
        // Prevent toggle if user is selecting text
        if (window.getSelection()?.toString().length) return;

        // Simple toggle based on current state
        handleToggle(!isChecked);
    };

    // Handler for the Checkbox CHANGE event
    const onCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
        // We do NOT stop propagation here because 'change' events don't trigger 'click' listeners.
        // The propagation that matters is the CLICK event, handled by the wrapper below.
        handleToggle(e.currentTarget.checked);
    };

    const triggerMutation = async (completed: boolean) => {
        try {
            await completeTask({
                taskId: task.id,
                listId: tasklistId,
                completed: completed,
                householdId: user?.householdId
            }).unwrap();
        } catch (err) {
            console.error("Failed to toggle task:", err);
            setIsChecked(!completed); // Rollback on error
        }
    };

    return (
        <li
            className={`${isChecked ? "featured-completed-task" : ""}`}
            onClick={onRowClick}
            style={{ cursor: "pointer" }}
        >
            <div className="featured-tasklist-task-left">
                {/* 
                  WRAPPER DIV:
                  1. onClick stopPropagation: Prevents clicks on the checkbox/label from bubbling to the LI.
                     This means clicking the checkbox triggers ONLY onCheckboxChange, not onRowClick.
                  2. display: flex: Ensures it doesn't take up extra width (fixing the "dead strip" issue).
                */}
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{ display: "flex", alignItems: "center" }}
                >
                    <Checkbox
                        size="16px"
                        radius="xl"
                        color="var(--tasklist-color)"
                        label={task.title}
                        checked={isChecked}
                        onChange={onCheckboxChange}
                        style={{ textDecoration: isChecked ? "line-through" : "none", color: isChecked ? "gray" : "inherit" }}
                        styles={{
                            label: {
                                fontSize: "14px"
                            }
                        }}
                    />
                </div>

                {showDetails && !isChecked && (
                    <div className="featured-task-details" onClick={(e) => e.stopPropagation()}>
                        <TaskExtra task={task} householdId={user?.householdId} listId={tasklistId} />
                    </div>
                )}
            </div>
            <div className="featured-tasklist-task-right">
                {task.isImportant ? <StarIcon size="16px" color="var(--tasklist-color)" /> : <StarIconOutline size="16px" color="var(--tasklist-color)" />}
            </div>
        </li>
    );
};
