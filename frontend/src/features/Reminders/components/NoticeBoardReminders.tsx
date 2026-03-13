import { useGetUserRemindersPreviewQuery, useGetUserRemindersQuery, type Reminder } from "@/store/reminderSlice";
import "../styles/Reminder.css"
import { useAuthenticateQuery, useGetHouseholdQuery } from "@/store";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';
import { NoticeBoardReminder } from "./NoticeBoardReminder";
import { useEffect, useMemo } from "react";
import { CreateReminder } from "./CreateReminder";
import { useNoticeBoard } from "@/contexts";
import { getVisibleReminders } from "../utils/getVisibleReminders";
import { Skeleton } from "@mantine/core";

dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

dayjs.updateLocale('en', {
    relativeTime: {
        future: "in %s",
        past: "%s ago",
        s: '1s',
        m: "1m",
        mm: "%dm",
        h: "1h",
        hh: "%dh",
        d: "1d",     // We will handle "yesterday" in the logic below
        dd: "%d days",
        M: "a month",
        MM: "%d months",
        y: "a year",
        yy: "%d years"
    }
});

type Props = {
    reminders: Reminder[];
    showAll?: boolean;
    isLoading?: boolean;
}

export const NoticeBoardReminders = ({ reminders, showAll = false, isLoading = false }: Props) => {
    const { unseenReminderSnapshot, onRemindersOpened } = useNoticeBoard();

    useEffect(() => {
        onRemindersOpened();
    }, []);

    const visible = useMemo(() => {
        if (showAll) return reminders;
        return getVisibleReminders(reminders, unseenReminderSnapshot);
    }, [reminders, unseenReminderSnapshot, showAll]);

    return (
        <div className="notice-board-reminders-container">
            <ul className="notice-board-reminders">
                {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => <NoticeBoardReminderSkeleton key={i} />)
                    : visible.map(reminder => <NoticeBoardReminder key={reminder.id} reminder={reminder} />)
                }
            </ul>
            <CreateReminder />
        </div>
    );
};

const NoticeBoardReminderSkeleton = () => {
    return (
        <div className="notice-board-reminder">
            <div className="notice-board-reminder-main">
                <div className="notice-board-reminder-body">
                    <Skeleton width="80%" radius="xl" height={10} />
                </div>
                <div className="notice-board-reminder-footer">
                    <Skeleton circle height={18} />
                    <div className="reminder-separator-dot skeleton-dot">·</div>
                    <Skeleton width="50px" radius="xl" height={8} />
                </div>
            </div>
        </div>
    )
}