import { Button, Tabs } from "@mantine/core"
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import { TbFlameFilled } from "react-icons/tb";
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import { useGetActivityQuery, useGetHouseholdQuery, useGetUserProfileStatsQuery, useGetUserQuery, useGetUserStatsQuery, useUpdateFeaturedStatsMutation } from "@/store";
import { useParams } from "react-router-dom";
import { UserSettings } from "@/features/UserSettings/components/UserSettings";
import { useState } from "react";
import { ActivityFeed } from "@/features/ActivityFeed";
import { UserProfileStat } from "./UserProfileStat";
import { UserProfileMainTabSkeleton } from "./UserProfileMainTabSkeleton";
import { HomepageActivityCollapseCard } from "@/components/HomepageCollapseCard/HomepageActivityCollapseCard";
import { CheckCircleIcon } from "@/assets/icons/CheckCircleIcon";

export const UserProfileMainTab = () => {
    const { userId } = useParams();
    const { data: profileUser } = useGetUserQuery(Number(userId))
    const { data: household } = useGetHouseholdQuery(profileUser?.householdId)
    const { data: stats, isLoading } = useGetUserProfileStatsQuery(Number(userId), {
        skip: !userId,
    });
    const [showUserSettings, setShowUserSettings] = useState(false);
    const { data: userStats } = useGetUserStatsQuery(Number(userId), {
        skip: !userId,
    });
    const [updateFeaturedStats] = useUpdateFeaturedStatsMutation();

    console.log('USER STATS:', userStats);

    const statsInfo = [
        {
            id: 1,
            icon: <CalendarMonthRoundedIcon />,
            stat: stats?.checkinStreak,
            statLabel: ` day${stats?.checkinStreak !== 1 ? "s" : ""}`,
            description: "longest check-in streak"
        },
        {
            id: 2,
            icon: <HowToRegRoundedIcon />,
            stat: stats?.checkinPct,
            statLabel: "%",
            description: "total check-ins"
        },
        {
            id: 3,
            icon: <AssignmentTurnedInRoundedIcon />,
            stat: stats?.tasksCompleted,
            statLabel: "",
            description: "tasks completed"
        },
        {
            id: 4,
            icon: <CheckCircleIcon size="1rem" color="black" />,
            stat: 6,
            statLabel: " days",
            description: "best habit streak"
        }
    ]

    return (
        <Tabs.Panel value="profile" className="user-profile-main-container">
            <Button onClick={() => setShowUserSettings(true)}>Settings</Button>
            <UserSettings opened={showUserSettings} onClose={() => setShowUserSettings(false)} />
            <div className="user-profile-section-header">
                <div className="user-profile-section-title">Featured Stats</div>
                <Button fw={500} h="auto" p="1rem .5rem" size="sm" color="rgb(5, 5, 73)">View more</Button>
            </div>
            <div className="user-profile-stats">
                {isLoading ? Array.from({ length: 4 }).map((_, i) => <UserProfileMainTabSkeleton key={i} />) : statsInfo.map((stat) => (
                    <UserProfileStat key={stat.id} icon={stat.icon} stat={stat.stat} statLabel={stat.statLabel} description={stat.description} />
                ))}
            </div>
            <HomepageActivityCollapseCard
                isReady={!!household?.id}
                householdId={household?.id!}
                actorId={profileUser?.id}
            />
        </Tabs.Panel>
    )
}