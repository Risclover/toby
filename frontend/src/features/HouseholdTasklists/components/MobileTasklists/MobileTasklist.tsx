import { MobileLayout } from "@/layout/MobileLayout";
import { useParams } from "react-router-dom";
import { Center, Loader, Stack, Group, Text, Button, Card, Space } from "@mantine/core";
import { skipToken } from "@reduxjs/toolkit/query";

import { useGetTasklistQuery } from "@/store/taskSlice";
import { useIsSmallScreen } from "@/hooks/useIsSmallScreen";
import { useMobileTasklistController } from "../../hooks/useMobileTasklistController";

import { MobileTasklistHeader } from "./MobileTasklistHeader";
import { HouseholdTasklistPageList } from "../HouseholdTasklistPage/HouseholdTasklistPageList";
import { HouseholdTasklistPageCompleted } from "../HouseholdTasklistPage/HouseholdTasklistPageCompleted";
import { HouseholdTasklistPageAddTask } from "../HouseholdTasklistPage/HouseholdTasklistPageAddTask";
import { TasklistSettings } from "../TasklistSettings/TasklistSettings";
import { ArchiveNotice } from "../ArchivedHouseholdTasklists/ArchiveNotice";
import { MobileTasklistTitleComponent } from "./MobileTasklistTitleComponent";

import "../../styles/MobileTasklist.css"
import { useStablePending } from "@/hooks";
import { useTasklistSettings, useTasklistStats } from "../../hooks";
import { useState } from "react";
import { DeleteConfirmation } from "../TasklistSettings";

export const MobileTasklist = () => {
    const { tasklistId } = useParams();
    const isSmall = useIsSmallScreen(425);
    const listId = (tasklistId && !isNaN(Number(tasklistId))) ? Number(tasklistId) : undefined;

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    const { data: tasklist, isFetching } = useGetTasklistQuery(
        listId ? Number(listId) : skipToken
    );

    const { handleArchiveList, handleDeleteList } = useTasklistSettings({ tasklistId: Number(tasklistId) })
    const { uncompleted } = useTasklistStats(tasklist?.tasks);
    const { inputRef, state, data } = useMobileTasklistController(tasklist);

    // Early Returns


    if (tasklistId === "archived") return null;
    if (!listId) return <div>Invalid list id.</div>;

    if (!tasklist) return <div>Tasklist not found.</div>;

    return (
        <MobileLayout
            titleComponent={
                <MobileTasklistTitleComponent
                    percent={data.percent}
                    tasklist={tasklist}
                    setShowTasklistSettings={state.setShowTasklistSettings}
                />
            }
        >
            <MobileTasklistHeader
                searchValue={state.searchValue}
                setSearchValue={state.setSearchValue}
                sortOption={state.sortOption}
                setSortOption={state.setSortOption}
                filters={state.filters}
                setFilters={state.setFilters}
                showReorderMode={state.showReorderMode}
                setShowReorderMode={state.setShowReorderMode}
                tasks={tasklist.tasks ?? []}
                filteredTasks={data.filteredTasks}
                listId={listId}
                currentSort={state.sortOption}
                tasklist={tasklist}
            />

            {tasklist.isArchived && <ArchiveNotice tasklistId={listId} />}

            <div className="mobile-tasklist-content">
                {data.isEmpty && (
                    <Stack justify="center" align="center" my={isSmall ? "5rem" : ""} h={!isSmall ? "100%" : ""}>
                        <Group w="100%" justify="center">
                            <Text c="black" style={{ lineHeight: "1.4", textAlign: "center" }}>
                                This tasklist contains no tasks. Add one below.
                            </Text>
                        </Group>
                    </Stack>
                )}

                {uncompleted.length === 0 && !tasklist?.isArchived && !data.isEmpty &&
                    <Card shadow="xs" radius={isSmall ? "0" : "md"} mb="0.5rem" padding={isSmall ? "lg" : "xl"}>
                        <Stack>
                            <Text fw={600} c="black" style={{ lineHeight: "1.4", textAlign: "center" }}>
                                🏅 All tasks completed! 🏅
                            </Text>
                            <Text size="sm" c="black" style={{ lineHeight: "1.4", textAlign: "center" }}>
                                If you're finished with this list, consider archiving or deleting it.
                            </Text>
                            <Group w="100%" gap="0.5rem" justify="center">
                                <Button
                                    color="var(--tasklist-color)"
                                    variant="outline"
                                    className="tasklist-settings-footer-btn"
                                    onClick={handleArchiveList}
                                >
                                    Archive list
                                </Button>
                                <Button
                                    color="var(--mantine-color-red-7)"
                                    variant="filled"
                                    className="tasklist-settings-footer-btn"
                                    loaderProps={{ children: 'Saving...' }}
                                    onClick={() => setShowDeleteConfirmation(true)}
                                >
                                    Delete list
                                </Button>
                            </Group>
                        </Stack>
                    </Card>
                }

                {data.filteredTasks.length > 0 ? (
                    <HouseholdTasklistPageList
                        tasklist={tasklist}
                        tasks={data.filteredTasks}
                        showReorderMode={state.showReorderMode}
                        setShowReorderMode={state.setShowReorderMode}
                        sortOption={state.sortOption}
                    />
                ) : (
                    !data.isEmpty && data.uncompleted.length > 0 && (
                        <Stack justify="center" align="center" my={isSmall ? "5rem" : ""} h={!isSmall ? "100%" : ""}>
                            <Group w="100%" justify="center">
                                <Text c="black" style={{ lineHeight: "1.4", textAlign: "center" }}>
                                    No tasks match your filters.
                                </Text>
                            </Group>
                        </Stack>
                    )
                )}

                {data.filteredCompleted.length > 0 && (
                    <HouseholdTasklistPageCompleted
                        tasklist={tasklist}
                        completed={data.filteredCompleted}
                        showCompleted={state.showCompleted}
                        setShowCompleted={state.setShowCompleted}
                    />
                )}
            </div>

            <div className="mobile-tasklist-input">
                <HouseholdTasklistPageAddTask
                    inputRef={inputRef}
                    listId={tasklist.id}
                    tasklist={tasklist}
                />
            </div>

            {state.showTasklistSettings && (
                <TasklistSettings
                    opened={state.showTasklistSettings}
                    setShowTasklistSettings={state.setShowTasklistSettings}
                />
            )}

            {showDeleteConfirmation && <DeleteConfirmation title={tasklist.title} opened={showDeleteConfirmation} setShowDeleteConfirmation={setShowDeleteConfirmation} handleDeleteList={handleDeleteList} />}
        </MobileLayout>
    );
};