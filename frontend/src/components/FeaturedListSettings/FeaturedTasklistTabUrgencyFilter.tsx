import { Chip, Group, Text } from "@mantine/core";
import type { FeaturedTasklistSettingsForm } from "./FeaturedTasklistTab";

type Props = {
    form: FeaturedTasklistSettingsForm;
};

export const FeaturedTasklistTabUrgencyFilter = ({ form }: Props) => {
    // Helper to handle toggling specific boolean fields in the nested object
    const handleToggle = (field: 'overdue' | 'dueToday' | 'dueSoon') => {
        const currentPath = `urgencyFilter.${field}`;
        const currentValue = form.getInputProps(currentPath).value;
        form.setFieldValue(currentPath, !currentValue);
    };

    return (
        <Group gap={0}>
            <Chip
                className="overdue-chip"
                checked={form.values.urgencyFilter.overdue}
                onChange={() => handleToggle('overdue')}
                color="var(--mantine-color-red-7)"
                variant="light"
                size="xs"
            >
                Overdue
            </Chip>

            <Chip
                className="today-chip"
                checked={form.values.urgencyFilter.dueToday}
                onChange={() => handleToggle('dueToday')}
                color="var(--mantine-color-orange-5)"
                variant="light"
                size="xs"
            >
                Due Today
            </Chip>

            <Chip
                className='soon-chip'
                checked={form.values.urgencyFilter.dueSoon}
                onChange={() => handleToggle('dueSoon')}
                color="var(--mantine-color-blue-4)"
                variant="light"
                size="xs"
            >
                Due Soon
            </Chip>
        </Group>
    );
};
