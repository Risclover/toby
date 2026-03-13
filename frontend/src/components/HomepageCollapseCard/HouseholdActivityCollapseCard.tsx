import { HomepageCollapseCard } from "./HomepageCollapseCard";
import { ActivityFeed } from "@/features";
import { useGetActivityQuery } from "@/store";

type Props = {
    householdId?: number;
};

export const HomepageActivityCollapseCard = ({ householdId }: Props) => {
    // Prefetch at this level so data is ready when ActivityFeed mounts
    useGetActivityQuery({ householdId: householdId! }, { skip: !householdId });

    return (
        <HomepageCollapseCard cardKey="activity" title="recent activity" color="var(--mantine-color-blue-6)">
            {householdId && <ActivityFeed householdId={householdId} />}
        </HomepageCollapseCard>
    );
};