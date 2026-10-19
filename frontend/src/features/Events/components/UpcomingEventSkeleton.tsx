import { Group, Paper, Skeleton, Stack } from "@mantine/core";

export const UpcomingEventSkeleton = () => (
    <Paper color="white" radius="md" p=".5rem" shadow="xs" className="upcoming-event">
        <Group justify="space-between">
            <Group>
                <div className="event-skeleton-date"><Skeleton h={35} w={30} /></div>
                <Stack gap=".25rem">
                    <Skeleton w="300px" h={8} />
                    <Skeleton w="50px" h={6} />
                </Stack>
            </Group>
        </Group>
    </Paper>
);