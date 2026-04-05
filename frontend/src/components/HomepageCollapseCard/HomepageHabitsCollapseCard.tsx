import { TodaysHabits } from "@/features/Habits/components/TodaysHabits"
import { HomepageCollapseCard } from "./HomepageCollapseCard"
import { useAuthenticateQuery, useGetUserHabitsQuery } from "@/store"
import { skipToken } from "@reduxjs/toolkit/query";
import { HomepageHabits } from "./HomepageHabits";

export const HomepageHabitsCollapseCard = () => {
    return (
        <HomepageCollapseCard cardKey="habits" title="daily habits" color="var(--mantine-color-grape-6)">
            <HomepageHabits />
        </HomepageCollapseCard>
    )
}