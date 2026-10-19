import { Group, Paper, Stack, Text } from "@mantine/core";
import dayjs from "dayjs";
import type { UpcomingRow } from "../hooks";

type Props = {
    row: UpcomingRow;
};

export const UpcomingEventRow = ({ row }: Props) => {
    const day = dayjs(row.dayYmd);

    return (
        <Paper color="white" radius="md" p=".5rem" shadow="xs" className="upcoming-event">
            <Group gap=".25rem" justify="space-between">
                <Group wrap="nowrap" miw={0} flex={1}>
                    {/* Small stacked "Jul 27" date badge */}
                    <div className="upcoming-event-date">
                        <Text fz="xs" c="var(--mantine-color-gray-7)">{day.format("MMM")}</Text>
                        <Text>{day.format("D")}</Text>
                    </div>
                    <Stack gap={0} maw="100%" miw={0}>
                        <Text fw={500} fz="sm" truncate miw={0}>{row.title}</Text>
                        <Text fz="xs" c="var(--mantine-color-gray-7)">{row.timeLabel}</Text>
                    </Stack>
                </Group>
            </Group>
        </Paper>
    );
};