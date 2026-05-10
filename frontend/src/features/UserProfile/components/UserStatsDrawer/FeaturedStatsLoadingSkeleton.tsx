import { Skeleton } from "@mantine/core"
import { useIsSmallScreen } from "@/hooks"

/** Loading skeleton for featured stats */
export const FeaturedStatsLoadingSkeleton = () => {
    return (
        <div className="featured-stats-grid">
            {Array.from({ length: 4 }).map((_, i) => <FeaturedStatsSkeleton />)}
        </div>
    )
}

const FeaturedStatsSkeleton = () => {
    const isSmall = useIsSmallScreen(425);
    return (
        <div className="featured-stat featured-stat-skeleton">
            <Skeleton circle radius="xl" h={isSmall ? 32 : 40} w={isSmall ? 32 : 40} />
            <Skeleton h={26} w={75} mt="8px" />
            <Skeleton h={10} w="100%" mt="4px" />
        </div>
    )
}