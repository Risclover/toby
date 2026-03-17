import { Skeleton } from "@mantine/core"
import "../styles/ActivityFeedSkeleton.css";

export const ActivityFeedSkeletons = () => {
    return (
        <ul className="activity-feed-skeletons">
            {Array.from({ length: 5 }).map((_, i) => <ActivityFeedSkeleton key={i} />)}
        </ul>
    )
}

const ActivityFeedSkeleton = () => {
    return (
        <li className="activity-feed-skeleton">
            <div className="activity-feed-skeleton-avatar">
                <Skeleton circle height={22} mr="5px" />
            </div>
            <div className="activity-feed-skeleton-content">
                <div className="activity-feed-skeleton-line1">
                    <Skeleton height={8} radius="xl" width="85%" mb="5px" />
                    <Skeleton height={8} radius="xl" w="45px" ml="5px" />
                </div>
                <div className="activity-feed-skeleton-line2">
                    <Skeleton height={6} radius="xl" width="100%" />
                </div>
            </div>
        </li>
    )
}