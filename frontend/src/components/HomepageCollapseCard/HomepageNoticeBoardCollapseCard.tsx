import type { JSX } from "react"
import { HomepageCollapseCard } from "./HomepageCollapseCard"
import { HomepageCollapseCardTab } from "./HomepageCollapseCardTab"
import { HomepageCollapseCardTabs } from "./HomepageCollapseCardTabs"
import { HomepageListsTasklist } from "./HomepageListsTasklist"
import { NoticeBoardReminders } from "@/features/Reminders/components/NoticeBoardReminders"
import { NoticeBoardAnnouncements } from "@/features/Announcements/components/NoticeBoardAnnouncements"

export const HomepageNoticeBoardCollapseCard = () => {
    const tabs = ["reminders", "announcements"];

    return (
        <HomepageCollapseCard cardKey="notice-board" title="Notice board" color="var(--mantine-color-red-6)">
            <HomepageCollapseCardTabs
                tabs={tabs}
                tabColor="var(--mantine-color-red-6)"
                defaultTab="reminders"
            >
                <HomepageCollapseCardTab value="reminders">
                    <NoticeBoardReminders />
                </HomepageCollapseCardTab>
                <HomepageCollapseCardTab value="announcements">
                    <NoticeBoardAnnouncements />
                </HomepageCollapseCardTab>
            </HomepageCollapseCardTabs>
        </HomepageCollapseCard>
    )
}