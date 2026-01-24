import { Avatar, Button, Drawer, Group, Stack, Text, Space, Tooltip } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { type TaskFilters, type TimeFilter } from "../../hooks/useTasklistFiltering";
import { useGetTasklistQuery, type TasklistType } from "@/store/taskSlice";

type Props = {
    opened: boolean;
    close: () => void;
    householdMembers: { id: number; firstName: string; profileImg: string }[] | undefined;
    filters: TaskFilters;
    setFilters: (val: TaskFilters) => void;
    listId: number;
};

// Map Display Labels to Internal Values
const TIME_OPTIONS: { label: string; value: TimeFilter }[] = [
    { label: "All", value: "all" },
    { label: "Past due", value: "past_due" },
    { label: "Today", value: "today" },
    { label: "Tomorrow", value: "tomorrow" },
    { label: "This week", value: "this_week" },
    { label: "This month", value: "this_month" },
];

export const MobileTasklistFilterDrawer = ({ opened, close, householdMembers, filters, setFilters, listId }: Props) => {
    const { data: tasklist } = useGetTasklistQuery(listId);

    const [localFilters, setLocalFilters] = useState(filters);

    // Sync when drawer opens
    useEffect(() => {
        if (opened) setLocalFilters(filters);
    }, [opened, filters]);

    const handleApply = () => {
        setFilters(localFilters);
        close();
    };

    const handleReset = () => {
        const resetFilters: TaskFilters = {
            importance: "all",
            assignedToId: null,
            time: "all",
        };
        setLocalFilters(resetFilters);
        setFilters(resetFilters);
        close();
    };

    const availableMembers = useMemo(() => {
        if (!householdMembers) return [];

        // Case 1: Tasklist is undefined (loading) -> Safe default empty or all
        if (!tasklist) return householdMembers;

        // Case 2: "All Members" is true -> Show everyone in household
        if (tasklist.allMembers) {
            return householdMembers;
        }

        // Case 3: Subset -> Filter household members by tasklist.memberIds
        const allowedIds = new Set(tasklist.memberIds?.map(Number) || []);
        return householdMembers.filter(m => allowedIds.has(m.id));

    }, [householdMembers, tasklist]);

    return (
        <Drawer
            className="filter-drawer"
            size="auto"
            styles={{
                content: { height: "min-content", borderTopLeftRadius: "1rem", borderTopRightRadius: "1rem", },
                body: { paddingBottom: "20px" }
            }}
            opened={opened}
            onClose={close}
            position="bottom"
            withCloseButton={false}
        >
            <div className="h-1 w-12 bg-muted mx-auto rounded-full mb-4"></div>
            <Stack justify="space-between" className="mobile-announcements-filter-drawer">

                {/* Importance */}
                <Stack gap="0.5rem">
                    <Text size="sm" fw={500} c="black">Importance:</Text>
                    <Group>
                        <Button
                            color="rgb(5, 5, 73)"
                            size="sm"
                            h="auto"
                            p="0.5rem 1rem"
                            fw={500}
                            variant={localFilters.importance === "all" ? "filled" : "outline"}
                            onClick={() => setLocalFilters({ ...localFilters, importance: "all" })}
                        >
                            All
                        </Button>
                        <Button
                            color="rgb(5, 5, 73)"
                            size="sm"
                            h="auto"
                            p="0.5rem 1rem"
                            fw={500}
                            variant={localFilters.importance === "important" ? "filled" : "outline"}
                            onClick={() => setLocalFilters({ ...localFilters, importance: "important" })}
                        >
                            Important
                        </Button>
                    </Group>
                </Stack>

                {/* Creator / Assignee */}
                <Stack className="filter-drawer-avatars" gap="0.5rem">
                    <Text size="sm" fw={500} c="black">Assigned to:</Text>
                    <Group gap="xs" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
                        {/* "All" Avatar Option */}
                        <div
                            style={{
                                cursor: 'pointer',
                                border: localFilters.assignedToId === null ? '2px solid rgb(5, 5, 73)' : '2px solid transparent',
                                borderRadius: '50%',
                                padding: '2px'
                            }}
                            onClick={() => setLocalFilters({ ...localFilters, assignedToId: null })}
                        >
                            <Avatar radius="xl" color="gray">All</Avatar>
                        </div>

                        {availableMembers?.map((member) => (
                            <div
                                key={member.id}
                                style={{
                                    border: localFilters.assignedToId === member.id ? "2px solid rgb(5, 5, 73)" : "2px solid transparent",
                                    cursor: "pointer",
                                    borderRadius: '50%',
                                    padding: '2px'
                                }}
                                onClick={() => setLocalFilters({ ...localFilters, assignedToId: localFilters.assignedToId === member.id ? null : member.id })}
                            >
                                <Tooltip
                                    withArrow
                                    label={member.firstName}
                                >
                                    <Avatar
                                        radius="xl"
                                        src={member.profileImg} // Check if your User type uses 'profileImg' or 'avatarUrl'
                                        alt={member.firstName}
                                    >
                                        {member.firstName?.[0]?.toUpperCase()}
                                    </Avatar>
                                </Tooltip>
                            </div>
                        ))}
                    </Group>
                </Stack>

                {/* Time */}
                <Stack gap="0.5rem">
                    <Text size="sm" fw={500} c="black">Due date:</Text>
                    <Group gap="xs">
                        {TIME_OPTIONS.map((option) => (
                            <Button
                                key={option.value}
                                color="rgb(5, 5, 73)"
                                size="sm"
                                h="auto"
                                // c="black"
                                fw={500}
                                p="0.5rem 1rem"
                                variant={localFilters.time === option.value ? "filled" : "outline"}
                                onClick={() => setLocalFilters({ ...localFilters, time: option.value })}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </Group>
                </Stack>

                {/* Actions */}
                <Group grow className="filter-drawer-submit-btns">
                    <Button color="rgb(5, 5, 73)" variant="light" onClick={handleReset}>
                        Reset
                    </Button>
                    <Button color="rgb(5, 5, 73)" onClick={handleApply}>
                        Apply
                    </Button>
                </Group>
            </Stack>
        </Drawer >
    );
};
