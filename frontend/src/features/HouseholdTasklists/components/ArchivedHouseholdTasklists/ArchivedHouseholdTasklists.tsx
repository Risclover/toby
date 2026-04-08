import type React from "react";
import dayjs from "dayjs";
import { Avatar, Center, Loader, Tooltip } from "@mantine/core";

import { useAuthenticateQuery, useGetTasklistsQuery } from "@/store";
import { ArchivedHouseholdTasklistsMenu } from "./ArchivedHouseholdTasklistsMenu";
import { useStablePending } from "@/hooks";
import { useHousehold } from "@/hooks/useHousehold";
import { Tasklist } from "../HouseholdTasklists";
import { useNavigate } from "react-router-dom";

export const ArchivedHouseholdTasklists = () => {
    const navigate = useNavigate();
    const { data: user, isSuccess: userLoaded } = useAuthenticateQuery();
    const { data: archivedLists, isFetching, isSuccess: dataLoaded } = useGetTasklistsQuery(
        { householdId: Number(user?.householdId), isArchived: true },
        { skip: !user?.householdId }
    );
    const { data: household } = useHousehold();

    // Use isFetching instead of isLoading to catch re-renders
    const isActuallyLoading = !userLoaded || isFetching;
    const loading = useStablePending(isActuallyLoading, { showAfterMs: 0, minVisibleMs: 500 });

    // 1. THE GATE: If we aren't 100% finished with both Auth AND Data, 
    // stay in the loading branch.
    if (loading || !dataLoaded) {
        return (
            <Center h="calc(100vh - 300px)">
                <Loader color="cyan" />
            </Center>
        );
    }

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
                {(user.id === household.adminId || user.id === list.creatorId) && <div className="archived-table-btns">
                    <ArchivedHouseholdTasklistsMenu tasklistId={list.id} />
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
            {archivedLists?.length === 0 ? <Center h="50vh">You haven't archived any tasklists.</Center> : archivedItems}
        </div>
    )
}