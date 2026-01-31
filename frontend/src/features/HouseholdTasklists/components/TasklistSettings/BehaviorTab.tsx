import type { User } from "@/store/authSlice";
import type { TasklistSettingsForm } from "./GeneralTab";
import { Avatar, Button, Group, Select, Stack, Switch, Tabs, Text, Tooltip } from "@mantine/core";
import { TIME_OPTIONS } from "./TasklistSettings";
import { SettingsItem } from "./SettingsItem";

type BehaviorTabProps = {
    form: TasklistSettingsForm;
    household: { members: User[] };
    allowedMembers: User[];
};

export const BehaviorTab = ({ form, household, allowedMembers }: BehaviorTabProps) => (
    <Tabs.Panel value="behavior" style={{ overflowY: "auto", padding: "16px", minHeight: 0 }}>
        <SettingsItem
            layout="column"
            label="New task default position"
            description="Choose where new tasks go by default."
            divider={true}
        >
            <Select
                allowDeselect={false}
                {...form.getInputProps('newItemPosition')}
                data={[
                    { value: "top", label: "Top of list" },
                    { value: "bottom", label: "Bottom of list" }
                ]}
            />
        </SettingsItem>
        <SettingsItem
            layout="column"
            label="Default sort order"
            description="Set the default sort order."
            divider={true}
        >
            <Select
                defaultValue="manual"
                placeholder="Sort by"
                {...form.getInputProps('defaultSortOrder')}
                data={[
                    { value: "manual", label: "Manual" },
                    { value: "alphabetical", label: "Alphabetical" },
                    { value: "due_date", label: "Due date" },
                    { value: "importance", label: "Importance" },
                    { value: "newest", label: "Newest" },
                    { value: "oldest", label: "Oldest" },
                ]}
            />
        </SettingsItem>
        <SettingsItem
            layout="column"
            label="Default filters"
            description="Apply filters automatically."
            divider={false}
        >
            <Stack mt="0.5rem" justify="space-between" className="mobile-announcements-filter-drawer">
                {/* Importance Filter */}
                <Stack gap="0.25rem">
                    <Text size="sm" fw={500} c="black">Importance:</Text>
                    <Group>
                        {['all', 'important'].map((opt) => (
                            <Button
                                key={opt}
                                color="var(--tasklist-color)"
                                size="sm"
                                h="auto"
                                p="0.5rem 1rem"
                                fw={500}
                                variant={form.values.defaultFilters.importance === opt ? "filled" : "outline"}
                                onClick={() => form.setFieldValue('defaultFilters.importance', opt as any)}
                            >
                                {opt === 'all' ? 'All' : 'Important'}
                            </Button>
                        ))}
                    </Group>
                </Stack>

                {/* Member Filter */}
                <Stack className="filter-drawer-avatars" gap="0.25rem">
                    <Text size="sm" fw={500} c="black">Assigned to:</Text>
                    <Group gap="xs" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
                        <div
                            style={{
                                cursor: 'pointer',
                                border: form.values.defaultFilters.assignedToId === null ? '2px solid var(--tasklist-color)' : '2px solid transparent',
                                borderRadius: '50%',
                                padding: '2px'
                            }}
                            onClick={() => form.setFieldValue('defaultFilters.assignedToId', null)}
                        >
                            <Avatar radius="xl" color="gray">All</Avatar>
                        </div>
                        {allowedMembers.map((member: User) => (
                            <div
                                key={member.id}
                                style={{
                                    border: form.values.defaultFilters.assignedToId === member.id ? "2px solid var(--tasklist-color)" : "2px solid transparent",
                                    cursor: "pointer",
                                    borderRadius: '50%',
                                    padding: '2px'
                                }}
                                onClick={() => {
                                    const current = form.values.defaultFilters.assignedToId;
                                    form.setFieldValue('defaultFilters.assignedToId', current === member.id ? null : member.id);
                                }}
                            >
                                <Tooltip label={member.firstName} withArrow>
                                    <Avatar radius="xl" src={member.profileImg}>
                                        {member.firstName?.[0]?.toUpperCase()}
                                    </Avatar>
                                </Tooltip>
                            </div>
                        ))}
                    </Group>
                </Stack>

                {/* Time Filter */}
                <Stack gap="0.25rem">
                    <Text size="sm" fw={500} c="black">Due date:</Text>
                    <Group gap="xs">
                        {TIME_OPTIONS.map((option) => (
                            <Button
                                key={option.value}
                                color="var(--tasklist-color)"
                                size="sm"
                                h="auto"
                                p="0.5rem 1rem"
                                fw={500}
                                variant={form.values.defaultFilters.time === option.value ? "filled" : "outline"}
                                onClick={() => form.setFieldValue('defaultFilters.time', option.value as any)}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </Group>
                </Stack>
            </Stack>
        </SettingsItem>
    </Tabs.Panel>
);