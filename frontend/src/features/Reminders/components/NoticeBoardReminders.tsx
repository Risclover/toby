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
}

export const NoticeBoardReminders = ({ reminders, showAll = false }: Props) => {
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
                {visible.map(reminder => <NoticeBoardReminder key={reminder.id} reminder={reminder} />)}
            </ul>
            <CreateReminder />
        </div>
    );
};