import { useIsSmallScreen } from "@/hooks"
import { Skeleton } from "@mantine/core"

export const UserProfileMainTabSkeleton = () => {
    const isSmall = useIsSmallScreen(425);
    return (
        <div className="user-profile-stat stat-skeleton">
            <span className="user-profile-stat-icon-skeleton"><Skeleton circle w={40} h={40} /></span>
            <span className="user-profile-stat-num"><Skeleton h={12} w={75} /></span>
            <span className="user-profile-stat-title"><Skeleton h={8} w={isSmall ? 100 : 150} /></span>
        </div>
    )
}