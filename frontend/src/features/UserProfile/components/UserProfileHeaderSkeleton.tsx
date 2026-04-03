import { useIsSmallScreen } from "@/hooks"
import { Skeleton } from "@mantine/core"

export const UserProfileHeaderSkeleton = () => {
    const isSmall = useIsSmallScreen(425);

    return (
        <div className="user-profile-header">
            <Skeleton circle w={isSmall ? 42 : 48} h={isSmall ? 42 : 48} />
            <div className="user-info">
                <Skeleton h={12} w={100} mb=".25rem" radius="xl" />
                <Skeleton h={6} w={120} />
            </div>
        </div>
    )
}