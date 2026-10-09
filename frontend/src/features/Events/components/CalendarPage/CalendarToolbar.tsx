import { Button, Group } from "@mantine/core";
import { AddEventButton } from "./AddEventButton";
import { CalendarMemberFilter } from "./CalendarMemberFilter";
import { useCalendar } from "@/contexts";

type CalendarToolbarProps = {
    date: string;
};

export const CalendarToolbar = ({ date }: CalendarToolbarProps) => {
    const { agenda } = useCalendar();

    const handleOpenAgenda = () => agenda.openForView(date);

    return (
        <Group justify="space-between" mb="xs">
            <CalendarMemberFilter />
            <Group gap={4}>
                <Button size="xs" variant="light" onClick={handleOpenAgenda}>Agenda</Button>
                <AddEventButton />
            </Group>
        </Group>
    );
};