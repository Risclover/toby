import { HomepageCollapseCard } from "./HomepageCollapseCard";
import { ActivityFeed } from "@/features";
import { useAuthenticateQuery } from "@/store";

export const HomepageActivityCollapseCard = () => {
    const { data: user } = useAuthenticateQuery();

    return (
        <HomepageCollapseCard cardKey="activity" title="recent activity" color="var(--mantine-color-blue-6)">
            {user?.householdId && <ActivityFeed householdId={user.householdId} />}
        </HomepageCollapseCard>
    );
};