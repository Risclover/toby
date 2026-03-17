import { MobileHomeFamilyTitle } from "@/components/MobileHomeFamilyTitle"
import "@/assets/styles/mobile.css";
import { MobileHomeNavGrid } from "@/components/MobileHomeNavGrid";
import { MobileLayout } from "@/layout/MobileLayout";
import { TaskStatusSection } from "@/components/DueTaskStats/TaskStatusSelection";
import { TimezoneSelect } from "@/components/TimezoneSelect";
import { useEffect, useState } from "react";
import { useAuthenticateQuery, useGetTasklistQuery, useGetUserSettingsQuery, useGetUserTaskStatsQuery, useUpdateTimezoneMutation } from "@/store";
import { Button } from "@mantine/core";
import { HomepageListsCollapseCard } from "@/components/HomepageCollapseCard/HomepageListsCollapseCard";
import { HomepageNoticeBoardCollapseCard } from "@/components/HomepageCollapseCard/HomepageNoticeBoardCollapseCard";
import { HomepageCheckinsCollapseCard } from "@/components/HomepageCollapseCard/HomepageCheckinsCollapseCard";
import { HomepageActivityCollapseCard } from "@/components/HomepageCollapseCard/HouseholdActivityCollapseCard";
import { HomepageEventsCollapseCard } from "@/components/HomepageCollapseCard/HomepageEventsCollapseCard";
import { useHousehold } from "@/hooks/useHousehold";
import { skipToken } from "@reduxjs/toolkit/query";

export const MobileHome = () => {
    const mobileHomeFamilyTitle = <MobileHomeFamilyTitle />
    const { data: user, isLoading: isAuthLoading } = useAuthenticateQuery();
    const { data: userSettings, isLoading: isSettingsLoading } = useGetUserSettingsQuery();
    const { isLoading: isHouseholdLoading } = useHousehold();
    const { isLoading: isTasklistLoading } = useGetTasklistQuery(
        userSettings?.featuredTasklist.featuredTasklistId ?? skipToken
    );
    const { isLoading: isTaskStatsLoading } = useGetUserTaskStatsQuery(
        user?.id ?? skipToken
    );

    const [updateTimezone] = useUpdateTimezoneMutation();
    const [timezone, setTimezone] = useState(user?.timezone || null);

    const isStatsReady = !isAuthLoading && !isTaskStatsLoading;

    const isCardsReady = !isAuthLoading
        && !isSettingsLoading
        && !isHouseholdLoading
        && !isTasklistLoading;

    const householdId = user?.householdId ?? (Number(localStorage.getItem("toby_household_id")) || undefined);

    const handleTimezone = async () => {
        const data = await updateTimezone(timezone);
        console.log('data:', data);
    }
    useEffect(() => {
        if (user?.householdId) {
            localStorage.setItem("toby_household_id", String(user.householdId));
        }
    }, [user?.householdId]);

    return (
        <MobileLayout titleComponent={mobileHomeFamilyTitle}>
            <MobileHomeNavGrid />
            <HomepageEventsCollapseCard isReady={isCardsReady} />
            <TaskStatusSection isReady={isStatsReady} />
            <HomepageNoticeBoardCollapseCard householdId={householdId} isReady={isCardsReady} />

            <HomepageListsCollapseCard isReady={isCardsReady} />
            <HomepageCheckinsCollapseCard isReady={isCardsReady} />
            <HomepageActivityCollapseCard householdId={householdId} isReady={isCardsReady} />


        </MobileLayout>
    )
}