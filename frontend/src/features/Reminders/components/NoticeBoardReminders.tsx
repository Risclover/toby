import { useGetUserRemindersQuery } from "@/store/reminderSlice";
import "../styles/Reminder.css"
import { useAuthenticateQuery } from "@/store";
import { Avatar, Button, Tooltip, UnstyledButton } from "@mantine/core";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';
import { getReminderTime } from "../utils/getReminderTime";
import { NoticeBoardReminder } from "./NoticeBoardReminder";
import { useMemo } from "react";

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
    const { data: reminders = [] } = useGetUserRemindersQuery(user?.id);

    const sortedReminders = useMemo(() => {
        return reminders
            .slice() // Create a shallow copy so we don't mutate the Redux state
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [reminders]);
    return (
        <div className="notice-board-reminders-container">
            <ul className="notice-board-reminders">{sortedReminders.map(reminder => <NoticeBoardReminder reminderId={reminder.id} reminder={reminder} />)}</ul>
        </div>
    )
}