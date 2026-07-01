import type React from "react";
import dayjs from "dayjs";
import { Avatar, Center, Loader, Skeleton, Tooltip } from "@mantine/core";

import { useAuthenticateQuery, useGetShoppingListsQuery, useGetTasklistsQuery } from "@/store";
import { ArchivedShoppingListsMenu } from "./ArchivedShoppingListsMenu";
import { useStablePending } from "@/hooks";
import { useHousehold } from "@/hooks/useHousehold";
import { useNavigate } from "react-router-dom";
import { DeleteConfirmation } from "@/components";
import { useState } from "react";
import "../../styles/ArchivedShoppingLists.css"

export const ArchivedShoppingLists = () => {
    const navigate = useNavigate();
    const { data: user, isSuccess: userLoaded } = useAuthenticateQuery();
    const { data: archivedLists, isFetching, isLoading, isSuccess: dataLoaded } = useGetShoppingListsQuery(
        { householdId: Number(user?.householdId), isArchived: true },
        { skip: !user?.householdId }
    );
    const { data: household } = useHousehold();
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    const isActuallyLoading = !userLoaded || isFetching;
    const loading = useStablePending(isActuallyLoading, { showAfterMs: 0, minVisibleMs: 500 });

    const handleAvatarKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, userId: number | undefined) => {
        if (e.key === "Enter" || e.key === " ") goToUserProfile(userId);
    }

    const goToUserProfile = (userId: number | undefined) => {
        window.open(`/profile/${userId}`, "_blank")
    }

    const archivedItems = archivedLists?.map(list => (
        <div className="archived-shopping-lists-item" onClick={() => navigate(`/shopping/${list.id}`)}>
            <div className="archived-shopping-lists-item-top">
                <div className="archived-shopping-lists-item-title">{list.title}</div>
                {(user.id === household?.adminId || user.id === list.creatorId) && <div className="archived-table-btns">
                    <ArchivedShoppingListsMenu list={list} tasklistId={list.id} />
                </div>}
            </div>
            <div className="archived-shopping-lists-item-bottom">
                <div className="archived-shopping-lists-item-data"><span>Archived on:</span> {dayjs(list.archivedDate).format("MMM DD, YYYY")}</div>
                <div className="archived-shopping-lists-item-data">
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
        <div className="archived-shopping-lists-container">
            {loading || !dataLoaded ? Array.from({ length: 12 }).map((_, i) => <ArchivedShoppingListsSkeleton />) : archivedLists?.length === 0 ? <Center h="50vh">You haven't archived any shopping lists.</Center> : archivedItems}
        </div>
    )
}

const ArchivedShoppingListsSkeleton = () => {
    return (
        <div className="archived-shopping-lists-item">
            <Skeleton h={12} w={305} mt={4} maw="100%" />
            <div className="archived-skeleton-bottom">
                <Skeleton h={8} w={150} mt={10} mb={6} />
                <Skeleton h={8} w={90} mt={10} mb={6} />
            </div>
        </div>
    )
}