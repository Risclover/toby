import type React from "react";
import dayjs from "dayjs";
import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetTasklistsQuery } from "@/store/taskSlice";
import { Avatar, Center, Loader, Tooltip } from "@mantine/core";
import { ArchivedHouseholdTasklistsMenu } from "./ArchivedHouseholdTasklistsMenu";

export const ArchivedHouseholdTasklists = () => {
    const { data: user, isSuccess: userLoaded } = useAuthenticateQuery();

    const { data: archivedLists, isLoading } = useGetTasklistsQuery(
        { householdId: Number(user?.householdId), isArchived: true },
        { skip: !user?.householdId }
    );

    const handleAvatarKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, userId: number | undefined) => {
        if (e.key === "Enter" || e.key === " ") goToUserProfile(userId);
    }

    const goToUserProfile = (userId: number | undefined) => {
        window.open(`/users/${userId}`, "_blank")
    }

    const archivedItems = archivedLists?.map(list => <div className="archived-household-tasklists-item">
        <div className="archived-household-tasklists-item-top">
            <div className="archived-household-tasklists-item-title">{list.title}</div>
            <div className="archived-table-btns">
                <ArchivedHouseholdTasklistsMenu tasklistId={list.id} />
            </div>
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
    </div>)

    // Loading state
    if (!userLoaded || isLoading)
        return (
            <Center h="100vh">
                <Loader
                    color="cyan"
                    style={{
                        transition: 'opacity 200ms ease-in',
                        opacity: isLoading ? 1 : 0,
                        transitionDelay: '300ms'
                    }}
                />
            </Center>
        )

    return (
        <div className="archived-household-tasklists-container">
            {archivedLists?.length === 0 ? <Center h="50vh">You haven't archived any tasklists.</Center> : archivedItems}
        </div>
    )
}