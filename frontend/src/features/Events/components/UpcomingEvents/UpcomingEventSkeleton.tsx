import { Skeleton, Stack } from "@mantine/core";

export const UpcomingEventSkeleton = () => (
    <Stack gap={6} py={8} px={4}>
        <Skeleton w="60%" h={14} />
        <Skeleton w={48} h={8} />
        <Skeleton w={110} h={10} />
    </Stack>
);