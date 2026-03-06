import { MobileAnnouncementsFull, MobileAnnouncementsHeader } from "@/components"
import { useCreateReminderModal } from "@/contexts";
import { CreateAnnouncement } from "@/features/Announcements"
import { MobileLayout } from "@/layout"
import { ActionIcon, Button } from "@mantine/core"
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreateReminder } from "../CreateReminder";
import { AllRemindersHeader } from "./AllRemindersHeader";
import { AllRemindersTabs } from "./AllRemindersTabs";
import "../../styles/AllRemindersPage.css"

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

export const AllRemindersPage = () => {
    const navigate = useNavigate();
    const { isOpen, openCreateReminderModal } = useCreateReminderModal();

    const title = <div className="mobile-home-family-title">
        <div className="title-announcements">
            <Button size="compact-xs" radius="xl" variant="subtle" color="white" onClick={() => navigate(-1)}><ChevronLeftRoundedIcon /></Button>
            <h1>Reminders</h1>
        </div>
        <ActionIcon
            className="add-announcement" size="lg" radius="md" variant="filled" color="white" c="rgb(5, 5, 73)"
            onClick={() => openCreateReminderModal()}
        >
            <PlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
        </ActionIcon>
    </div >
    return (
        <MobileLayout titleComponent={title}>
            {/* <AllRemindersHeader /> */}
            <AllRemindersTabs />
            <CreateReminder />
        </MobileLayout>
    )
}