import type { User } from "@/store/authSlice";
import type { TasklistSettingsForm } from "./GeneralTab";
import { Avatar, Button, Divider, Group, Input, Select, Stack, Switch, Tabs, Text, Tooltip } from "@mantine/core";
import { TIME_OPTIONS } from "./TasklistSettings";

type BehaviorTabProps = {
    form: TasklistSettingsForm;
    household: { members: User[] };
};

export const BehaviorTab = ({ form, household }: BehaviorTabProps) => (
    <Tabs.Panel value="behavior" style={{ overflowY: "auto", padding: "16px", minHeight: 0 }}>
        <div className="tasklist-settings-section section-column">
            <div className="input-label-description">
                <Input.Label>New task default position</Input.Label>
                <Input.Description>Choose where new tasks go by default.</Input.Description>
            </div>
            <Select
                allowDeselect={false}
                {...form.getInputProps('newItemPosition')}
                data={[
                    { value: "top", label: "Top of list" },
                    { value: "bottom", label: "Bottom of list" }
                ]}
            />
        </div>
        <Divider my="lg" />
        <div className="tasklist-settings-section">
            <div className="input-label-description">
                <Input.Label>Starred tasks at top</Input.Label>
                <Input.Description>Decide where starred tasks go by default.</Input.Description>
            </div>
            <Switch
                {...form.getInputProps('starsAtTop', { type: 'checkbox' })}
                color="cyan"
                size="md"
                withThumbIndicator={false}
            />
        </div>
        <Divider my="lg" />
        <div className="tasklist-settings-section section-column">
            <div className="input-label-description">
                <Input.Label>Default sort order</Input.Label>
                <Input.Description>Set the default sort order.</Input.Description>
            </div>
            <Select
                {...form.getInputProps('defaultSortOrder')}
                clearable
                data={[
                    { value: "due_date", label: "Due date" },
                    { value: "importance", label: "Importance" },
                    { value: "alphabetical", label: "Alphabetical" },
                    { value: "newest", label: "Newest" }
                ]}
            />
        </div>
        <Divider my="lg" />
        <div className="tasklist-settings-section section-column">
            <div className="input-label-description larger">
                <Input.Label>Default filters</Input.Label>
                <Input.Description>Apply filters automatically.</Input.Description>
            </div>
            <Stack mt="0.5rem" justify="space-between" className="mobile-announcements-filter-drawer">
                {/* Importance Filter */}
                <Stack gap="0.25rem">
                    <Text size="sm" fw={500} c="black">Importance:</Text>
                    <Group>
                        {['all', 'important'].map((opt) => (
                            <Button
                                key={opt}
                                color="cyan"
                                size="sm"
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
                                border: form.values.defaultFilters.assignedToId === null ? '2px solid var(--mantine-color-cyan-7)' : '2px solid transparent',
                                borderRadius: '50%',
                                padding: '2px'
                            }}
                            onClick={() => form.setFieldValue('defaultFilters.assignedToId', null)}
                        >
                            <Avatar radius="xl" color="gray">All</Avatar>
                        </div>
                        {household.members?.map((member: User) => (
                            <div
                                key={member.id}
                                style={{
                                    border: form.values.defaultFilters.assignedToId === member.id ? "2px solid var(--mantine-color-cyan-7)" : "2px solid transparent",
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
                                color="cyan"
                                size="sm"
                                variant={form.values.defaultFilters.time === option.value ? "filled" : "outline"}
                                onClick={() => form.setFieldValue('defaultFilters.time', option.value as any)}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </Group>
                </Stack>
            </Stack>
        </div>
    </Tabs.Panel>
);