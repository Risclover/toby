import { HouseholdCheckinsMini } from "@/features"
import { HomepageCollapseCard } from "./HomepageCollapseCard"
import { useAuthenticateQuery, useGetHouseholdQuery } from "@/store"

export const HomepageCheckinsCollapseCard = () => {
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useGetHouseholdQuery(user?.householdId);
    return (
        <HomepageCollapseCard cardKey="check-ins" title="daily check-ins" color="var(--mantine-color-green-6)">
            <HouseholdCheckinsMini members={household?.members} timezone={user?.timezone} />
        </HomepageCollapseCard>
    )
}