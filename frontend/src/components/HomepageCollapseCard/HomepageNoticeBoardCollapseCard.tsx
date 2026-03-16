import { useState, type JSX, type ReactNode } from "react"
import { HomepageCollapseCard } from "./HomepageCollapseCard"
import { HomepageCollapseCardTab } from "./HomepageCollapseCardTab"
import { HomepageCollapseCardTabs } from "./HomepageCollapseCardTabs"
import { HomepageListsTasklist } from "./HomepageListsTasklist"
import { NoticeBoardReminders } from "@/features/Reminders/components/NoticeBoardReminders"
import { NoticeBoardAnnouncements } from "@/features/Announcements/components/NoticeBoardAnnouncements"
import { Badge, Button, Indicator } from "@mantine/core"
import { useCreateAnnouncementModal, useCreateReminderModal, useNoticeBoard } from "@/contexts"
import { useNavigate } from "react-router-dom"
import { useAnnouncementIndicator } from "@/features/Announcements/hooks/useAnnouncementIndicator"
import { useAuthenticateQuery, useGetHouseholdQuery, useGetUserRemindersPreviewQuery } from "@/store"
import { NoticeBoardProvider } from "@/contexts"
import { useHousehold } from "@/hooks/useHousehold"

export const HomepageNoticeBoardCollapseCard = ({ householdId, isReady }: { isReady: boolean; householdId?: number | undefined }) => {
    return (
        <NoticeBoardProvider>
            <HomepageNoticeBoardContent isReady={isReady} householdId={householdId} />
        </NoticeBoardProvider>
    )
}

const HomepageNoticeBoardContent = ({ isReady, householdId }: { isReady: boolean; householdId?: number }) => {
    const {
        hasUnseen,
        hasOpenedAnnouncements,
        onAnnouncementsOpened,
        hasUnseenReminders,
        hasOpenedReminders,
        onRemindersOpened,
    } = useNoticeBoard();
    const { openModal } = useCreateAnnouncementModal();
    const { openCreateReminderModal } = useCreateReminderModal();
    const navigate = useNavigate();
    const tabs = ["reminders", "announcements"];

    const { data: user } = useAuthenticateQuery();
    const { data: household } = useHousehold();
    const { data: reminders = [], isLoading: remindersLoading } = useGetUserRemindersPreviewQuery(householdId!, {
        skip: !householdId
    });

    const badge = (hasUnseen && !hasOpenedAnnouncements) || (hasUnseenReminders && !hasOpenedReminders)
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
                        if (value === "reminders") onRemindersOpened();
                    }}
                    tabIndicator={(tab) => {
                        if (tab === "announcements" && hasUnseen && !hasOpenedAnnouncements)
                            return <Indicator color="red" size={6} processing />;
                        if (tab === "reminders" && hasUnseenReminders && !hasOpenedReminders)
                            return <Indicator color="red" size={6} processing />;
                        return null;
                    }}
                >
                    <HomepageCollapseCardTab value="reminders">
                        <NoticeBoardReminders isReady={isReady} reminders={reminders} isLoading={remindersLoading} />
                        <div className="notice-board-footer">
                            <Button size="compact-sm" color="var(--mantine-color-red-6)" radius="xl" onClick={() => openCreateReminderModal()}>+ New reminder</Button>
                            <Button p={0} size="xs" fw={400} variant="transparent" radius="xl" color="var(--mantine-color-red-7)" onClick={() => navigate("/reminders")}>View all →</Button>
                        </div>
                    </HomepageCollapseCardTab>
                    <HomepageCollapseCardTab value="announcements">
                        <NoticeBoardAnnouncements />
                        <div className="notice-board-footer">
                            <Button size="compact-sm" color="var(--mantine-color-red-6)" radius="xl" onClick={() => openModal()}>+ New announcement</Button>
                            <Button size="xs" p={0} fw={400} variant="transparent" radius="xl" color="var(--mantine-color-red-7)" onClick={() => navigate("/announcements")}>View all →</Button>
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