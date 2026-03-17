import { HomepageCollapseCard } from "./HomepageCollapseCard";
import { ActivityFeed } from "@/features";
import { useGetActivityQuery } from "@/store";

type Props = {
    isReady: boolean;
    householdId?: number;
};

export const HomepageActivityCollapseCard = ({ isReady, householdId }: Props) => {
    // Prefetch at this level so data is ready when ActivityFeed mounts
    useGetActivityQuery({ householdId: householdId! }, { skip: !householdId });

    return (
        <HomepageCollapseCard cardKey="activity" title="recent activity" color="var(--mantine-color-blue-6)">
            {householdId && <ActivityFeed isReady={isReady} householdId={householdId} />}
        </HomepageCollapseCard>
    );
};