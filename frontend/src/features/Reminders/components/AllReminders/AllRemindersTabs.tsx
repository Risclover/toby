import { Tabs } from "@mantine/core"
import { AllRemindersTab } from "./AllRemindersTab"
import { AssignedRemindersTab } from "./AssignedRemindersTab"
import { MyRemindersTab } from "./MyRemindersTab"
import { useIsSmallScreen } from "@/hooks"

export const AllRemindersTabs = () => {
    const isSmall = useIsSmallScreen();
    return (
        <Tabs className="all-reminders-tabs" defaultValue="assignedToMe">
            <Tabs.List className="all-reminders-tabs-list">
                <Tabs.Tab value="assignedToMe" color="rgb(5, 5, 73)">Assigned to me</Tabs.Tab>
                <Tabs.Tab value="createdByMe" color="rgb(5, 5, 73)">Created by me</Tabs.Tab>
            </Tabs.List>
            <div className="all-reminders-page-main">
                <Tabs.Panel value="assignedToMe" pt={!isSmall ? "xs" : ""}>
                    <AssignedRemindersTab />
                </Tabs.Panel>

                <Tabs.Panel value="createdByMe" pt={!isSmall ? "xs" : ""}>
                    <MyRemindersTab />
                </Tabs.Panel>
            </div>
        </Tabs>
    )
}