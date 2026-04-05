import { HomepageCollapseCard } from "./HomepageCollapseCard";
import { ActivityFeed } from "@/features";
import { useGetActivityQuery } from "@/store";

type Props = {
    isReady?: boolean;
    householdId?: number;
    actorId?: number;
};

export const HomepageActivityCollapseCard = ({ isReady, householdId, actorId }: Props) => {
    useGetActivityQuery({ householdId: householdId! }, { skip: !householdId });

    return (
        <HomepageCollapseCard cardKey="activity" title="recent activity" color="var(--mantine-color-blue-6)" scrollSelector=".events-list">
            {householdId && <ActivityFeed isReady={isReady} householdId={householdId} actorId={actorId} />}
        </HomepageCollapseCard>
    );
};