import { useParams } from "react-router-dom";
import type { UserStatsSectionProps } from "../components/UserStatsDrawer/UserStatsSection";
import { useAuthenticateQuery, useGetUserQuery, useGetUserStatsQuery } from "@/store";
import { UserStatIcons } from "@/assets";

/** Custom hook that handles the logic and data for user stats */
export const useUserStats = () => {
    const { userId } = useParams();
    const { data: user } = useAuthenticateQuery();
    const { data: userStats, isLoading } = useGetUserStatsQuery(Number(userId));
    const { data: profileUser } = useGetUserQuery(Number(userId));

    const isOwner = user?.id === Number(userId);
    const featuredStats = profileUser?.featuredStats ?? [];

    const statsInfo = [
        {
            id: "checkin-stats",
            sectionTitle: "Daily Check-Ins",
            stats: [
                {
                    title: "Total check-ins",
                    icon: UserStatIcons.TotalCheckinsAllTime,
                    stat: userStats?.totalCheckins || 0,
                    statId: "totalCheckins",
                    statUnit: "",
                    iconColor: "#339af0"
                },
                {
                    title: "Overall check-in rate",
                    icon: UserStatIcons.CheckinRate30Days,
                    stat: userStats?.checkinRate30Days || 0,
                    statId: "checkinRate30Days",
                    statUnit: "%",
                    iconColor: "#339af0"

                },
                {
                    title: "Current check-in streak",
                    icon: UserStatIcons.CurrentCheckinStreak,
                    stat: userStats?.currentCheckinStreak || 0,
                    statId: "currentCheckinStreak",
                    statUnit: ` ${userStats?.currentCheckinStreak === 1 ? "day" : "days"}`,
                    iconColor: "#339af0"

                },
                {
                    title: "Longest check-in streak",
                    icon: UserStatIcons.LongestCheckinStreak,
                    stat: userStats?.longestCheckinStreak || 0,
                    statId: "longestCheckinStreak",
                    statUnit: ` ${userStats?.longestCheckinStreak === 1 ? "day" : "days"}`,
                    iconColor: "#339af0"

                },

            ]
        },
        {
            id: "task-stats",
            sectionTitle: "Tasks",
            stats: [
                {
                    title: "Tasks completed",
                    icon: UserStatIcons.TasksCompletedAllTime,
                    stat: userStats?.tasksCompleted || 0,
                    statId: "tasksCompleted",
                    statUnit: "",
                    iconColor: "#845ef7"
                },
                {
                    title: "Tasks created",
                    icon: UserStatIcons.TasksCreated,
                    stat: userStats?.tasksCreated || 0,
                    statId: "tasksCreated",
                    statUnit: "",
                    iconColor: "#845ef7"
                },
                {
                    title: "Tasks completed this month",
                    icon: UserStatIcons.TasksCompletedMonth,
                    stat: userStats?.tasksCompletedThisMonth || 0,
                    statId: "tasksCompletedThisMonth",
                    statUnit: "",
                    iconColor: "#845ef7"
                }
            ]
        },
        {
            id: "habit-stats",
            sectionTitle: "Habits",
            stats: [
                {
                    title: "Best habits streak",
                    icon: UserStatIcons.BestHabitStreak,
                    stat: userStats?.bestHabitStreak || 0,
                    statId: "bestHabitStreak",
                    statUnit: ` ${userStats?.bestHabitStreak === 1 ? "day" : "days"}`,
                    iconColor: "#20c997"
                },
                {
                    title: "This month's habit completion rate",
                    icon: UserStatIcons.AverageDailyHabitRate,
                    stat: userStats?.habitRateThisMonth || 0,
                    statId: "habitRateThisMonth",
                    statUnit: "%",
                    iconColor: "#20c997"
                },
                {
                    title: "Perfect habit days",
                    icon: UserStatIcons.PerfectHabitDays,
                    stat: userStats?.perfectHabitDays || 0,
                    statId: "perfectHabitDays",
                    statUnit: ` ${userStats?.perfectHabitDays === 1 ? "day" : "days"}`,
                    iconColor: "#20c997"
                }
            ]
        }
    ]

    const featuredStatsInfo = statsInfo.reduce((acc, section) => {
        const featuredStatsInSection = section.stats.filter((stat) => featuredStats.includes(stat.statId));
        return [...acc, ...featuredStatsInSection];
    }, [] as UserStatsSectionProps['stats']);

    return {
        statsInfo,
        featuredStatsInfo,
        featuredStats,
        isLoading,
        isOwner
    }
}