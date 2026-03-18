import { Group, Paper, Text, SimpleGrid, ThemeIcon, Stack, rem, UnstyledButton, Box, Divider, Title } from '@mantine/core';
import { OverdueStatIcon } from "@/assets/icons/OverdueStatIcon"
import { DueTaskStat } from "./DueTaskStat"
import { OverdueIcon } from "@/assets"
import { DueTodayStatIcon } from "@/assets/icons/DueTodayStatIcon"
import { DueSoonStatIcon } from "@/assets/icons/DueSoonStatIcon"
import { useIsSmallScreen } from '@/hooks';
import { useAuthenticateQuery, useGetUserTaskStatsQuery } from '@/store';
import { TimeSensitiveModal } from './TimeSensitiveModal';
import { useState } from 'react';

export function TaskStatusSection({ isReady }: { isReady: boolean }) {
    const isSmall = useIsSmallScreen(375);
    const isMedium = useIsSmallScreen(425);
    const { data: user } = useAuthenticateQuery();
    const userId = user?.id;

    const { data, isSuccess, isLoading, isFetching } = useGetUserTaskStatsQuery(userId, {
        skip: !userId,
        pollingInterval: 60000,
        refetchOnFocus: true,
    });

    const [openTimeSensitiveModal, setOpenTimeSensitiveModal] = useState(false);
    const [activeTab, setActiveTab] = useState("overdue");

    const showSkeleton = !isReady || isLoading || (!isSuccess && !data);


    // FIX: Use 'data' if it exists, even if it's currently refetching.
    // This prevents the count from dropping to 0 (and turning gray) during the reload.
    const statsData = data || { overdue: [], due_today: [], due_soon: [] };

    // ONLY show gray if we have NO data at all (first load) 
    // OR if the count is actually 0.
    const getIconColor = (count: number, activeColor: string) => {
        if (isLoading && !data) return "var(--mantine-color-gray-5)";
        return count === 0 ? "var(--mantine-color-gray-5)" : activeColor;
    };

    const stats = [
        {
            label: 'Overdue',
            count: statsData.overdue.length,
            color: "var(--mantine-color-red-7)", // Keep this for the text color
            // Rename to 'icon' since it is already a rendered element
            icon: (
                <OverdueStatIcon
                    size={isSmall ? "20px" : isMedium ? "28px" : "32px"}
                    color={getIconColor(statsData.overdue.length, "var(--mantine-color-red-7)")}
                />
            )
        },
        {
            label: 'Due Today',
            count: statsData.due_today.length,
            color: "var(--mantine-color-orange-5)",
            icon: (
                <DueTodayStatIcon
                    size={isSmall ? "20px" : isMedium ? "28px" : "32px"}
                    color={getIconColor(statsData.due_today.length, "var(--mantine-color-orange-5)")}
                />
            )
        },
        {
            label: 'Due Soon',
            count: statsData.due_soon.length,
            color: "var(--mantine-color-blue-4)",
            icon: (
                <DueSoonStatIcon
                    size={isSmall ? "20px" : isMedium ? "28px" : "32px"}
                    color={getIconColor(statsData.due_soon.length, "var(--mantine-color-blue-4)")}
                />
            )
        },
    ];

    return (
        <div className="mobile-home-section">
            <div className="mobile-home-section-content">
                <Group grow gap={0}>
                    {stats.map((item, index) => {
                        return (
                            <Box
                                key={item.label}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    // Fade effect to solve the "Stale Data" problem
                                }}
                            >
                                <Box pt={isSmall ? ".75rem" : "1rem"} pb={isSmall ? ".5rem" : "0.75rem"} style={{ flex: 1 }}>
                                    <DueTaskStat
                                        // We use the color defined in the object, 
                                        // or gray if the count is 0
                                        isLoading={!isReady}
                                        color={getIconColor(item.count, item.color)}
                                        title={item.label}
                                        count={item.count}
                                        icon={item.icon} // 👈 Render the pre-defined icon element here
                                        setOpenTimeSensitiveModal={setOpenTimeSensitiveModal}
                                        setActiveTab={setActiveTab}
                                    />
                                </Box>

                                {index < stats.length - 1 && (
                                    <Divider orientation="vertical" h={rem(40)} my="auto" />
                                )}
                            </Box>
                        );
                    })}
                </Group>
            </div>
            <TimeSensitiveModal activeTab={activeTab} opened={openTimeSensitiveModal} close={() => setOpenTimeSensitiveModal(false)} />
        </div>
    );
}