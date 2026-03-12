import { useGetUserRemindersPreviewQuery, useGetUserRemindersQuery } from "@/store/reminderSlice";
import "../styles/Reminder.css"
import { useAuthenticateQuery, useGetHouseholdQuery } from "@/store";
import { Avatar, Button, Tooltip, UnstyledButton } from "@mantine/core";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';
import { getReminderTime } from "../utils/getReminderTime";
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

export const NoticeBoardReminders = () => {
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useGetHouseholdQuery(user?.householdId);
    const { data: reminders = [] } = useGetUserRemindersPreviewQuery(household?.id, {
        skip: !household?.id
    });
    const { unseenReminderSnapshot, onRemindersOpened } = useNoticeBoard();

    useEffect(() => {
        onRemindersOpened();
    }, []);

    const visible = useMemo(() => {
        return getVisibleReminders(reminders, unseenReminderSnapshot);
    }, [reminders, unseenReminderSnapshot]);

    return (
        <div className="notice-board-reminders-container">
            <ul className="notice-board-reminders">
                {visible.map(reminder => <NoticeBoardReminder key={reminder.id} reminder={reminder} />)}
            </ul>
            <CreateReminder />
        </div>
    );
};