import { MobileLayout } from "@/layout/MobileLayout";
import { useParams } from "react-router-dom";
import { Center, Loader, Stack, Group, Text } from "@mantine/core";
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

export const MobileTasklist = () => {
    const { tasklistId } = useParams();
    const isSmall = useIsSmallScreen();
    const listId = (tasklistId && !isNaN(Number(tasklistId))) ? Number(tasklistId) : undefined;

    const { data: tasklist, isFetching } = useGetTasklistQuery(
        listId ? Number(listId) : skipToken
    );

    const { inputRef, state, data } = useMobileTasklistController(tasklist);

    // Early Returns
    if (tasklistId === "archived") return null;
    if (!listId) return <div>Invalid list id.</div>;
    if (isFetching && !tasklist) {
        return (
            <Center h="100vh">
                <Loader color="cyan" style={{ opacity: 1, transition: 'opacity 200ms ease-in' }} />
            </Center>
        );
    }
    if (!tasklist) return <div>Task list not found.</div>;

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
                            <Text color="black" style={{ lineHeight: "1.4", textAlign: "center" }}>
                                This tasklist contains no tasks. Add one below.
                            </Text>
                        </Group>
                    </Stack>
                )}

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
                        <div className="no-matches-notice">No tasks match your filters.</div>
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
        </MobileLayout>
    );
};