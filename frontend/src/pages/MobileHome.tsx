import { MobileHomeFamilyTitle } from "@/components/MobileHomeFamilyTitle"
import "@/assets/styles/mobile.css";
import { MobileHomeNavGrid } from "@/components/MobileHomeNavGrid";
import { MobileLayout } from "@/layout/MobileLayout";
import { TaskStatsSection } from "@/components/DueTaskStats/TaskStatsSelection";
import { TimezoneSelect } from "@/components/TimezoneSelect";
import { useEffect, useState } from "react";
import { useAuthenticateQuery, useGetFeaturedListSettingsQuery, useGetTasklistQuery, useGetUserTaskStatsQuery, useUpdateTimezoneMutation } from "@/store";
import { Button } from "@mantine/core";
import { HomepageListsCollapseCard } from "@/components/HomepageCollapseCard/HomepageListsCollapseCard";
import { HomepageNoticeBoardCollapseCard } from "@/components/HomepageCollapseCard/HomepageNoticeBoardCollapseCard";
import { HomepageCheckinsCollapseCard } from "@/components/HomepageCollapseCard/HomepageCheckinsCollapseCard";
import { HomepageActivityCollapseCard } from "@/components/HomepageCollapseCard/HomepageActivityCollapseCard";
import { HomepageEventsCollapseCard } from "@/components/HomepageCollapseCard/HomepageEventsCollapseCard";
import { useHousehold } from "@/hooks/useHousehold";
import { skipToken } from "@reduxjs/toolkit/query";
import { HomepageHabitsCollapseCard } from "@/components/HomepageCollapseCard/HomepageHabitsCollapseCard";
import { useGetCurrentUserSettingsQuery } from "@/store/userSettingsSlice";

export const MobileHome = () => {
    const mobileHomeFamilyTitle = <MobileHomeFamilyTitle />
    const { data: user, isLoading: isAuthLoading } = useAuthenticateQuery();
    const { data: settings, isLoading: isSettingsLoading } = useGetFeaturedListSettingsQuery();
    const { isLoading: isHouseholdLoading } = useHousehold();
    const { isLoading: isTasklistLoading } = useGetTasklistQuery(
        settings?.featuredTasklist.tasklistId ?? skipToken
    );
    const { isLoading: isTaskStatsLoading } = useGetUserTaskStatsQuery(
        user?.id ?? skipToken
    );
    const { data: userSettings, isLoading: isUserSettingsLoading } = useGetCurrentUserSettingsQuery(user?.id ?? skipToken);

    const [updateTimezone] = useUpdateTimezoneMutation();
    const [timezone, setTimezone] = useState(user?.timezone || null);

    const [minDelayPassed, setMinDelayPassed] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMinDelayPassed(true), 1000);
        return () => clearTimeout(timer);
    }, []);

    const isCardsReady = minDelayPassed
        && !isAuthLoading
        && !isSettingsLoading
        && !isHouseholdLoading
        && !isTasklistLoading
        && !isUserSettingsLoading;

    const isStatsReady = minDelayPassed && !isAuthLoading && !isTaskStatsLoading;

    // Gate entire card layout on userSettings resolving so habits card
    // doesn't pop in after everything else has already rendered
    const isLayoutReady = !isUserSettingsLoading;

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
            {isLayoutReady && (
                <>
                    <HomepageEventsCollapseCard isReady={isCardsReady} />
                    <TaskStatsSection isReady={isStatsReady} />
                    <HomepageNoticeBoardCollapseCard householdId={householdId} isReady={isCardsReady} />
                    <HomepageListsCollapseCard isReady={isCardsReady} />
                    {userSettings?.settings.habitsOnHomepage && (
                        <HomepageHabitsCollapseCard isReady={isCardsReady} />
                    )}
                    <HomepageCheckinsCollapseCard isReady={isCardsReady} />
                    <HomepageActivityCollapseCard householdId={householdId} isReady={isCardsReady} />
                </>
            )}
        </MobileLayout>
    )
}