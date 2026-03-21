import { useIsSmallScreen } from "@/hooks";
import { useGetHouseholdQuery, useGetUserQuery } from "@/store";
import { Avatar, Text } from "@mantine/core"
import { useParams } from "react-router-dom"

export const UserProfileHeader = () => {
    const isSmall = useIsSmallScreen(425);
    const { userId } = useParams();

    const { data: user } = useGetUserQuery(userId)
    const { data: household } = useGetHouseholdQuery(user?.householdId)

    console.log('sara:', user)
    return (
        <div className="user-profile-header">
            <Avatar size={isSmall ? 42 : 48} src={user?.profileImg} styles={{ root: { border: "2px solid white" } }} />
            <div className="user-info">
                <h1>{user?.firstName} {user?.lastName}</h1>
                <Text c="var(--mantine-color-gray-5)" size="xs">{household?.name} · since January 2024</Text>
            </div>
        </div>
    )
}