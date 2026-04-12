import type React from "react";
import dayjs from "dayjs";
import { Avatar, Center, Loader, Skeleton, Tooltip } from "@mantine/core";

import { useAuthenticateQuery, useGetTasklistsQuery } from "@/store";
import { ArchivedHouseholdTasklistsMenu } from "./ArchivedHouseholdTasklistsMenu";
import { useStablePending } from "@/hooks";
import { useHousehold } from "@/hooks/useHousehold";
import { Tasklist } from "../HouseholdTasklists";
import { useNavigate } from "react-router-dom";
import { DeleteConfirmation } from "..";
import { useState } from "react";

export const ArchivedHouseholdTasklists = () => {
    const navigate = useNavigate();
    const { data: user, isSuccess: userLoaded } = useAuthenticateQuery();
    const { data: archivedLists, isFetching, isLoading, isSuccess: dataLoaded } = useGetTasklistsQuery(
        { householdId: Number(user?.householdId), isArchived: true },
        { skip: !user?.householdId }
    );
    const { data: household } = useHousehold();
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    // Use isFetching instead of isLoading to catch re-renders
    const isActuallyLoading = !userLoaded || isFetching;
    const loading = useStablePending(isActuallyLoading, { showAfterMs: 0, minVisibleMs: 500 });

    // 1. THE GATE: If we aren't 100% finished with both Auth AND Data, 
    // stay in the loading branch.

    const handleAvatarKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, userId: number | undefined) => {
        if (e.key === "Enter" || e.key === " ") goToUserProfile(userId);
    }

    const goToUserProfile = (userId: number | undefined) => {
        window.open(`/profile/${userId}`, "_blank")
    }

    const archivedItems = archivedLists?.map(list => (
        <div className="archived-household-tasklists-item" onClick={() => navigate(`/tasklists/${list.id}`)}>
            <div className="archived-household-tasklists-item-top">
                <div className="archived-household-tasklists-item-title">{list.title}</div>
                {(user.id === household?.adminId || user.id === list.creatorId) && <div className="archived-table-btns">
                    <ArchivedHouseholdTasklistsMenu list={list} tasklistId={list.id} />
                </div>}
            </div>
            <div className="archived-household-tasklists-item-bottom">
                <div className="archived-household-tasklists-item-data"><span>Archived on:</span> {dayjs(list.createdAt).format("MMM DD, YYYY")}</div>
                <div className="archived-household-tasklists-item-data">
                    <span>Archived by:</span>
                    <Tooltip events={{ hover: true, focus: true, touch: true }} withArrow label={list.archivedBy?.firstName}>
                        <Avatar
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    handleAvatarKeyDown(e, list.archivedBy?.id)
                                }
                            }}
                            onClick={() => goToUserProfile(list.archivedBy?.id)}
                            tabIndex={0}
                            size="xs"
                            src={list.archivedBy?.profileImg || undefined}
                        />
                    </Tooltip>
                </div>
            </div>
        </div>
    ));


    return (
        <div className="archived-household-tasklists-container">
            {loading || !dataLoaded ? Array.from({ length: 12 }).map((_, i) => <ArchivedTasklistsSkeleton />) : archivedLists?.length === 0 ? <Center h="50vh">You haven't archived any tasklists.</Center> : archivedItems}
        </div>
    )
}

const ArchivedTasklistsSkeleton = () => {
    return (
        <div className="archived-household-tasklists-item">
            <Skeleton h={12} w={305} mt={4} maw="100%" />
            <div className="archived-skeleton-bottom">
                <Skeleton h={8} w={150} mt={10} mb={6} />
                <Skeleton h={8} w={90} mt={10} mb={6} />
            </div>
        </div>
    )
}