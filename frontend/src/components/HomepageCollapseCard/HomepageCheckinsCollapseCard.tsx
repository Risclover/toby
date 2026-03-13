import { HouseholdCheckinsMini } from "@/features"
import { HomepageCollapseCard } from "./HomepageCollapseCard"
import { useAuthenticateQuery, useGetHouseholdQuery } from "@/store"

export const HomepageCheckinsCollapseCard = () => {
    const { data: user } = useAuthenticateQuery();
    const { data: household, isLoading } = useGetHouseholdQuery(user?.householdId);
    return (
        <HomepageCollapseCard cardKey="check-ins" title="daily check-ins" color="var(--mantine-color-green-6)">
            <HouseholdCheckinsMini
                members={isLoading ? undefined : household?.members}
                timezone={user?.timezone}
            />
        </HomepageCollapseCard>
    )
}