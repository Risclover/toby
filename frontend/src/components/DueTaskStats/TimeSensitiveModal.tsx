import { Box, Button, Checkbox, Group, Modal, Tabs } from "@mantine/core"
import { OverdueTab } from "./OverdueTab";
import { useAuthenticateQuery, useGetUserTaskStatsQuery } from "@/store";
import { useIsSmallScreen } from "@/hooks";
import { DueTodayTab } from "./DueTodayTab";
import { DueSoonTab } from "./DueSoonTab";

export const TimeSensitiveModal = ({ opened, close, activeTab }: { opened: boolean; close: () => void; activeTab?: string; }) => {
    const { data: user } = useAuthenticateQuery();
    const { data: tasks } = useGetUserTaskStatsQuery(user?.id, { skip: !user?.id });
    const isSmall = useIsSmallScreen(425);

    if (!tasks) return null;
    return (
        <Modal fullScreen={isSmall} size="lg" opened={opened} onClose={close} radius="md" title="Time-Sensitive Tasks">
            <Tabs defaultValue={activeTab}>
                <Tabs.List styles={{ list: { padding: "0 1rem" } }}>
                    <Tabs.Tab value="overdue" color="red.7">Overdue</Tabs.Tab>
                    <Tabs.Tab value="due_today" color="orange.7">Due Today</Tabs.Tab>
                    <Tabs.Tab value="due_soon" color="blue.7">Due Soon</Tabs.Tab>
                </Tabs.List>
                <OverdueTab tasks={tasks.overdue} />
                <DueTodayTab tasks={tasks.due_today} />
                <DueSoonTab tasks={tasks.due_soon} />
            </Tabs>
        </Modal>
    )
}