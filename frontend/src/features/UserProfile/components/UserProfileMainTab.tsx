import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Tabs } from "@mantine/core"
import { useGetHouseholdQuery, useGetUserQuery } from "@/store";
import { UserSettings } from "@/features/UserSettings/components/UserSettings";
import { HomepageActivityCollapseCard } from "@/components/HomepageCollapseCard/HomepageActivityCollapseCard";
import { UserStatsDrawer } from "./UserStatsDrawer";
import { FeaturedStatsSection } from "./UserStatsDrawer/FeaturedStatsSection";
import { useUserStats } from "../hooks/useUserStats";

export const UserProfileMainTab = () => {
    const { userId } = useParams();
    const { data: profileUser } = useGetUserQuery(Number(userId))
    const { data: household } = useGetHouseholdQuery(profileUser?.householdId)
    const { featuredStatsInfo, isLoading } = useUserStats();

    const [showUserSettings, setShowUserSettings] = useState(false);
    const [showStatsDrawer, setShowStatsDrawer] = useState(false);

    return (
        <Tabs.Panel value="profile" className="user-profile-tab-container">
            <div className="user-profile-tab-container--main">
                <Button onClick={() => setShowUserSettings(true)}>Settings</Button>
                <UserSettings opened={showUserSettings} onClose={() => setShowUserSettings(false)} />
                <FeaturedStatsSection
                    setShowStatsDrawer={setShowStatsDrawer}
                    featuredStatsInfo={featuredStatsInfo}
                    isDrawer={false}
                    isLoading={isLoading}
                />
                <HomepageActivityCollapseCard
                    isReady={!!household?.id}
                    householdId={household?.id!}
                    actorId={profileUser?.id}
                />
                <UserStatsDrawer
                    opened={showStatsDrawer}
                    close={() => setShowStatsDrawer(false)}
                />
            </div>
        </Tabs.Panel>
    )
}