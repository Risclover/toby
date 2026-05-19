import React, { useMemo } from "react";
import { ActionIcon, Progress, Text, Tooltip } from "@mantine/core";
import { skipToken } from "@reduxjs/toolkit/query";

// Logic & Hooks
import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdQuery } from "@/store/householdSlice";
import { useMobileTasklist } from "../../hooks/useMobileTasklist";
import { useTasklistStats } from "../../hooks/useTasklistStats";
import { useTasklistTheme } from "../../hooks/useTasklistTheme";

// Components
import { HouseholdTasklistTask } from "./HouseholdTasklistTask";
import { MemberAvatarGroup } from "../MemberAvatarGroup";
import { TasklistCardTooltip } from "./TasklistCardTooltip";
import { StarIcon, StarIconOutline } from "@/assets/icons/StarIcon";
import { OverdueIcon } from "@/assets/icons/OverdueIcon";
import { TodayIcon } from "@/assets/icons/TodayIcon";
import { SoonIcon } from "@/assets/icons/SoonIcon";

// Types
import type { TasklistType } from "@/store/taskSlice";
import { useTasklistActions } from "../../hooks/useTasklistActions";
import { useHouseholdTasklistLogic } from "../../hooks/useHouseholdTasklistLogic";
import { TasklistActionsMenu } from "./TasklistActionsMenu";
import { useTasklistSettings } from "../../hooks";
import { DeleteConfirmation } from "@/components";
import { Tasklist } from "./Tasklist";
import { useHousehold } from "@/hooks/useHousehold";
import { useGetFeaturedListSettingsQuery } from "@/store";

type HouseholdTasklistProps = {
    list: TasklistType;
};

/**
 * Wrapper Component: Remains the same to preserve your re-order mount logic.
 */
export function HouseholdTasklist(props: HouseholdTasklistProps) {
    const tasks = props.list.tasks ?? [];
    const orderSignature = useMemo(() => {
        return tasks.map((t: any) => `${t.id}_${t.sortIndex ?? 0}`).join('|');
    }, [tasks]);

    return <HouseholdTasklistContent key={orderSignature} {...props} />;
}

export function HouseholdTasklistContent({ list }: HouseholdTasklistProps) {
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useHousehold();
    const { data: userSettings } = useGetFeaturedListSettingsQuery();

    const { showDeleteConfirmation, setShowDeleteConfirmation, handleDeleteList } = useTasklistSettings({ tasklistId: list.id });

    // 1. Logic & Action Hooks
    useTasklistTheme(list.color);
    const { percent, uncompleted, completedCount, overdue, dueToday, dueSoon } = useTasklistStats(list.tasks);
    const { navigateToTasklistPage, toggleFeatured, handleStarKeyDown } =
        useTasklistActions(list.id, user?.id, household?.id);

    // 2. View-Specific Logic Hook
    const { tasksSorted, listMembers, remainingCount } = useHouseholdTasklistLogic({
        list,
        uncompleted,
        householdMembers: household?.members
    });

    console.log('LIST::', list)

    // 3. Mobile Tasklist Drag/Move Hook
    const { tasks, moveTask } = useMobileTasklist({ initialTasks: tasksSorted });

    return (
        <>
            <div
                className="tasklist-card"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigateToTasklistPage()}
                onClick={navigateToTasklistPage}
                style={{ "--tasklist-color": list.color ?? "#15aabf" } as React.CSSProperties}
            >
                <div className="mobile-tasklist-card-header">
                    <div className="mobile-tasklist-card-header-top">
                        <Text lineClamp={2} c="black" fw={500} className="tasklist-head-title">{list.title}</Text>
                        <div className="mobile-tasklist-card-header-top header-right">
                            <Tooltip withArrow label={list.id === userSettings?.featuredTasklist.tasklistId ? "Remove as featured" : "Set as featured"}>
                                <ActionIcon
                                    size="compact-xs"
                                    onClick={toggleFeatured}
                                    onKeyDown={handleStarKeyDown}
                                    color={list.id === userSettings?.featuredTasklist.tasklistId ? "rgb(230, 176, 2)" : "cyan"}
                                    variant="transparent"
                                >
                                    {list.id === userSettings?.featuredTasklist.tasklistId ? <StarIcon color="rgb(230, 176, 2)" size="20px" /> : <StarIconOutline color="var(--mantine-color-gray-6)" size="20px" />}
                                </ActionIcon>
                            </Tooltip>
                            {(user.id === household?.adminId || user.id === list.creatorId) && <TasklistActionsMenu tasklistId={list.id} setShowDeleteConfirmation={setShowDeleteConfirmation} />}
                        </div>
                    </div>
                    <div className="tasklist-head-progress progress">
                        <div className="progress-left"><Progress color={list.color} value={percent} /></div>
                        {percent}%
                    </div>
                </div>

                <div className={`mobile-tasklist-card-body${uncompleted.length <= 3 ? " extra-padding" : ""}`}>
                    <span className="tasklists-list-empty-state">
                        {uncompleted.length === 0 && (completedCount === 0 ? "Empty list." : "🏅 All completed!")}
                    </span>
                    <ul>
                        {tasksSorted?.slice(0, 3).map((task: any) => (
                            <HouseholdTasklistTask key={task.id} task={task} moveTask={moveTask} />
                        ))}
                    </ul>
                    {remainingCount > 0 && <div className="household-tasklist-bottom">+ {remainingCount} more</div>}
                </div>

                <div className="mobile-tasklist-card-footer">
                    <MemberAvatarGroup members={listMembers} />
                    <div className="mobile-tasklist-card-data">
                        <Tooltip.Group openDelay={300} closeDelay={100}>

                            {/* 1. Pass the desired color to the wrapper */}
                            <TasklistCardTooltip label="Overdue" stat={overdue} color="var(--mantine-color-red-7)">
                                {/* 2. Set Icon color to "currentColor" so it inherits the wrapper's color (red OR grey) */}
                                <OverdueIcon size="16px" color="currentColor" /> {overdue}
                            </TasklistCardTooltip>

                            <TasklistCardTooltip label="Due today" stat={dueToday} color="var(--mantine-color-orange-5)">
                                <TodayIcon size="16px" color="currentColor" /> {dueToday}
                            </TasklistCardTooltip>

                            <TasklistCardTooltip label="Due soon" stat={dueSoon} color="var(--mantine-color-blue-4)">
                                <SoonIcon size="16px" color="currentColor" /> {dueSoon}
                            </TasklistCardTooltip>

                        </Tooltip.Group>
                    </div>
                </div>
            </div>
            {showDeleteConfirmation && <DeleteConfirmation itemName={list.title} itemType="tasklist" modalTitle="Confirm delete tasklist" opened={showDeleteConfirmation} setShowDeleteConfirmation={setShowDeleteConfirmation} handleDeleteItem={handleDeleteList} />}
        </>
    );
}

// title, opened, setShowDeleteConfirmation, handleDeleteList