import { Box, Button, Checkbox, Group, Modal, Tabs } from "@mantine/core"
import { TimeSensitiveTasksTab } from "./TimeSensitiveTasksTab";
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
                    <Tabs.Tab value="overdue" color="red.7" className="tab-overdue">Overdue</Tabs.Tab>
                    <Tabs.Tab value="due_today" color="orange.7" className="tab-today">Due Today</Tabs.Tab>
                    <Tabs.Tab value="due_soon" color="blue.7" className="tab-soon">Due Soon</Tabs.Tab>
                </Tabs.List>
                <TimeSensitiveTasksTab tabValue="overdue" emptyMsg="You have no overdue tasks - good job!" tasks={tasks.overdue} />
                <TimeSensitiveTasksTab tabValue="due_today" emptyMsg="No tasks due today." tasks={tasks.due_today} />
                <TimeSensitiveTasksTab tabValue="due_soon" emptyMsg="No tasks due this week." tasks={tasks.due_soon} />
            </Tabs>
        </Modal>
    )
}