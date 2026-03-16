import { HouseholdCheckinsMini } from "@/features"
import { HomepageCollapseCard } from "./HomepageCollapseCard"
import { useAuthenticateQuery, useGetHouseholdQuery } from "@/store"
import { useHousehold } from "@/hooks/useHousehold";

export const HomepageCheckinsCollapseCard = ({ isReady }: { isReady: boolean }) => {
    const { data: user } = useAuthenticateQuery();
    const { data: household, isLoading } = useHousehold();
    return (
        <HomepageCollapseCard cardKey="check-ins" title="daily check-ins" color="var(--mantine-color-green-6)">
            <HouseholdCheckinsMini
                members={isLoading ? undefined : household?.members}
                timezone={user?.timezone}
                isReady={isReady}
            />
        </HomepageCollapseCard>
    )
}