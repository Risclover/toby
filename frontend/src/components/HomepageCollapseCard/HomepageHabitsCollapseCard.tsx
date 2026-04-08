import { TodaysHabits } from "@/features/Habits/components/TodaysHabits"
import { HomepageCollapseCard } from "./HomepageCollapseCard"
import { useAuthenticateQuery, useGetUserHabitsQuery } from "@/store"
import { skipToken } from "@reduxjs/toolkit/query";
import { HomepageHabits } from "./HomepageHabits";


type Props = {
    isReady: boolean;
}
export const HomepageHabitsCollapseCard = ({ isReady }: Props) => {
    return (
        <HomepageCollapseCard cardKey="habits" title="today's habits" color="var(--mantine-color-grape-6)" scrollSelector=".homepage-habits-list">
            <HomepageHabits isReady={isReady} />
        </HomepageCollapseCard>
    )
}