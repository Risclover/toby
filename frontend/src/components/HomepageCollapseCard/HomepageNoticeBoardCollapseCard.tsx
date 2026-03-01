import { useState, type JSX, type ReactNode } from "react"
import { HomepageCollapseCard } from "./HomepageCollapseCard"
import { HomepageCollapseCardTab } from "./HomepageCollapseCardTab"
import { HomepageCollapseCardTabs } from "./HomepageCollapseCardTabs"
import { HomepageListsTasklist } from "./HomepageListsTasklist"
import { NoticeBoardReminders } from "@/features/Reminders/components/NoticeBoardReminders"
import { NoticeBoardAnnouncements } from "@/features/Announcements/components/NoticeBoardAnnouncements"
import { Badge, Button, Indicator } from "@mantine/core"
import { useCreateAnnouncementModal, useNoticeBoard } from "@/contexts"
import { useNavigate } from "react-router-dom"
import { useAnnouncementIndicator } from "@/features/Announcements/hooks/useAnnouncementIndicator"
import { useAuthenticateQuery } from "@/store"
import { NoticeBoardProvider } from "@/contexts"

export const HomepageNoticeBoardCollapseCard = () => {
    return (
        <NoticeBoardProvider>
            <HomepageNoticeBoardContent />
        </NoticeBoardProvider>
    )
}

const HomepageNoticeBoardContent = () => {
    const { hasUnseen, hasOpenedAnnouncements, onAnnouncementsOpened } = useNoticeBoard();
    const { openModal } = useCreateAnnouncementModal();
    const navigate = useNavigate();
    const tabs = ["reminders", "announcements"];

    const badge = hasUnseen && !hasOpenedAnnouncements
        ? <Badge variant="light" color="red" size="sm">New</Badge>
        : null;

    return (
        <HomepageNoticeBoardCollapseCardContainer>
            <HomepageCollapseCard cardKey="notice-board" title="Notice board" color="var(--mantine-color-red-6)" badge={badge}>
                <HomepageCollapseCardTabs
                    tabs={tabs}
                    tabColor="var(--mantine-color-red-6)"
                    defaultTab="reminders"
                    onTabChange={(value) => {
                        if (value === "announcements") onAnnouncementsOpened();
                    }}
                    tabIndicator={(tab) =>
                        tab === "announcements" && hasUnseen && !hasOpenedAnnouncements
                            ? <Indicator color="red" size={6} processing />
                            : null
                    }
                >
                    <HomepageCollapseCardTab value="reminders">
                        <NoticeBoardReminders />
                        <div className="notice-board-footer">
                            <Button size="compact-sm" color="var(--mantine-color-red-6)" radius="xl">+ New reminder</Button>
                            <Button size="xs" fw={400} variant="transparent" radius="xl" color="var(--mantine-color-red-7)">View all →</Button>
                        </div>
                    </HomepageCollapseCardTab>
                    <HomepageCollapseCardTab value="announcements">
                        <NoticeBoardAnnouncements />
                        <div className="notice-board-footer">
                            <Button size="compact-sm" color="var(--mantine-color-red-6)" radius="xl" onClick={() => openModal()}>+ New announcement</Button>
                            <Button size="xs" fw={400} variant="transparent" radius="xl" color="var(--mantine-color-red-7)" onClick={() => navigate("/announcements")}>View all →</Button>
                        </div>
                    </HomepageCollapseCardTab>
                </HomepageCollapseCardTabs>
            </HomepageCollapseCard>
        </HomepageNoticeBoardCollapseCardContainer>
    )
}

const HomepageNoticeBoardCollapseCardContainer = ({ children }: { children: ReactNode }) => {
    return (
        <NoticeBoardProvider>
            {children}
        </NoticeBoardProvider>
    )
}