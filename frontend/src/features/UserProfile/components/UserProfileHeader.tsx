import { useIsSmallScreen } from "@/hooks";
import { useGetHouseholdQuery, useGetUserQuery } from "@/store";
import { Avatar, Badge, Text } from "@mantine/core"
import dayjs from "dayjs";
import { useParams } from "react-router-dom"

export const UserProfileHeader = () => {
    const isSmall = useIsSmallScreen(425);
    const { userId } = useParams();

    const { data: user } = useGetUserQuery(userId)
    const { data: household } = useGetHouseholdQuery(user?.householdId)

    const joinDate = dayjs(user?.createdAt).format("MMMM YYYY");

    console.log('sara:', user)
    return (
        <div className="user-profile-header">
            <Avatar size={isSmall ? 42 : 48} src={user?.profileImg} styles={{ root: { border: "2px solid white" } }} />
            <div className="user-info">
                <div className="user-info-top"><h1>{user?.firstName} {user?.lastName}</h1>{user?.id === household?.adminId && <Badge size="md" fw={500} color="rgb(147, 111, 206)" variant="filled" c="white">Admin</Badge>}</div>
                <Text c="var(--mantine-color-gray-5)" size="xs">{household?.name} · since {joinDate}</Text>
            </div>
        </div>
    )
}