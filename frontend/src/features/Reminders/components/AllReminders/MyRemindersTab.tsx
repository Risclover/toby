import { useAuthenticateQuery, useGetUserCreatedRemindersQuery, type Reminder } from "@/store"
import { NoticeBoardReminder } from "../NoticeBoardReminder";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';
import { Button } from "@mantine/core";

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

export const MyRemindersTab = () => {
    const { data: user } = useAuthenticateQuery();
    const [page, setPage] = useState(1);

    const { data } = useGetUserCreatedRemindersQuery(
        { userId: user?.id, page, limit: 5 },
        { skip: !user?.id }
    );

    const [allReminders, setAllReminders] = useState<Reminder[]>([]);

    useEffect(() => {
        if (data?.items) {
            setAllReminders(prev =>
                page === 1 ? data.items : [...prev, ...data.items]
            );
        }
    }, [data]);

    return (
        <div className="my-reminders-tab">
            {allReminders.map(reminder => (
                <NoticeBoardReminder key={reminder.id} reminder={reminder} />
            ))}
            {allReminders.length === 0 && <div className="empty-announcements">No reminders yet.</div>}
            {data?.hasNextPage && (
                <Button
                    variant="subtle"
                    color="var(--mantine-color-red-6)"
                    size="compact-sm"
                    onClick={() => setPage(p => p + 1)}
                >
                    Load more
                </Button>
            )}
        </div>
    );
};