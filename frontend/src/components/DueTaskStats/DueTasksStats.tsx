import { OverdueStatIcon } from "@/assets/icons/OverdueStatIcon"
import { DueTaskStat } from "./DueTaskStat"
import { OverdueIcon } from "@/assets"
import { DueTodayStatIcon } from "@/assets/icons/DueTodayStatIcon"
import { DueSoonStatIcon } from "@/assets/icons/DueSoonStatIcon"
import { Divider, Group, Stack } from "@mantine/core"
export const DueTasksStats = () => {
    return (
        <Stack mt="1.5rem" w="100%" mx="auto" p="1rem">
            At a Glance
            <Group w="300px" gap="1.5rem">
                <DueTaskStat color="red.7" title="Overdue" count={0} icon={<OverdueStatIcon size="28px" color="var(--mantine-color-red-7)" />} />
                <DueTaskStat color="orange.5" title="Due Today" count={2} icon={<DueTodayStatIcon size="28px" color="var(--mantine-color-orange-5)" />} />
                <DueTaskStat color="blue.4" title="Due Soon" count={9} icon={<DueSoonStatIcon size="28px" color="var(--mantine-color-blue-4)" />} />
            </Group>
        </Stack>
    )
}