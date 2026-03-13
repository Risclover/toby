import { useAuthenticateQuery, useGetAllUserRemindersQuery, useGetUserRemindersQuery, type Reminder } from "@/store";
import { NoticeBoardReminders } from "../NoticeBoardReminders"
import { useEffect, useState } from "react";
import { Button } from "@mantine/core";

export const AssignedRemindersTab = () => {
    const { data: user } = useAuthenticateQuery();
    const [page, setPage] = useState(1);

    const { data } = useGetAllUserRemindersQuery(
        { userId: user?.id, page, limit: 5 },
        { skip: !user?.id }
    );

    const [allReminders, setAllReminders] = useState<Reminder[]>([]);

    useEffect(() => {
        if (data?.items) {
            const today = new Date().toISOString().slice(0, 10);
            const triggered = data.items.filter(r =>
                !r.triggerDate || r.triggerDate <= today
            );
            setAllReminders(prev =>
                page === 1 ? triggered : [...prev, ...triggered]
            );
        }
    }, [data]);

    return (
        <div className="assigned-reminders-tab">
            <NoticeBoardReminders reminders={allReminders} showAll />
            {data?.hasNextPage && (
                <Button
                    variant="subtle"
                    ml=".5rem"
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