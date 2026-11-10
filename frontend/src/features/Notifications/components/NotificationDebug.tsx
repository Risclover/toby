import { Code, Stack, Text } from "@mantine/core";
import { useGetNotificationsQuery, useGetUnseenCountQuery } from "@/store/notificationSlice";

const POLL_MS = 5000;

/** TEMPORARY: raw view of the notification API while the backend is being verified. */
export default function NotificationDebug() {
    const { data } = useGetNotificationsQuery(undefined, { pollingInterval: POLL_MS });
    const { data: unseen } = useGetUnseenCountQuery(undefined, { pollingInterval: POLL_MS });

    return (
        <Stack>
            <Text>Unseen: {unseen?.count ?? "…"}</Text>
        </Stack>
    );
}