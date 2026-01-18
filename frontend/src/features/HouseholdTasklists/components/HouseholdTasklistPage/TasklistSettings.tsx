import { InfoIcon } from "@/assets/icons/InfoIcon";
import { useIsSmallScreen } from "@/hooks/useIsSmallScreen";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { useAuthenticateQuery, type User } from "@/store/authSlice";
import { useGetTasklistQuery } from "@/store/taskSlice";
import { ActionIcon, Avatar, Box, Button, Checkbox, ColorInput, Divider, Flex, Group, Input, Modal, MultiSelect, Radio, rem, ScrollArea, Select, Space, Stack, Switch, Tabs, Text, TextInput, Tooltip, type MultiSelectProps } from "@mantine/core"
import React, { useEffect, useRef, useState, type SetStateAction } from "react";
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import { useGetHouseholdQuery } from "@/store/householdSlice";
import { useTasklistSettings } from "../../hooks/useTasklistSettings";
import type { TimeFilter } from "../../hooks/useTasklistFiltering";
import ColorizeRoundedIcon from '@mui/icons-material/ColorizeRounded';
import { StarIcon } from "@/assets/icons/StarIcon";

type Props = {
    opened: boolean;
    handleClose: () => void;
}

type TasklistDefaultFilters = {
    importance: "all" | "important";
    assignedToId: null | number; // userId
    time:
    | "past_due"
    | "today"
    | "tomorrow"
    | "this_week"
    | "this_month"
    | "all";
};

const TIME_OPTIONS: { label: string; value: TimeFilter }[] = [
    { label: "Past due", value: "past_due" },
    { label: "Today", value: "today" },
    { label: "Tomorrow", value: "tomorrow" },
    { label: "This week", value: "this_week" },
    { label: "This month", value: "this_month" },
    { label: "All", value: "all" },
];

export const TasklistSettings = ({ opened, handleClose }: Props) => {
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useGetHouseholdQuery(user?.householdId);
    const { data: tasklist } = useGetTasklistQuery(user?.householdId)
    const isSmallScreen = useIsSmallScreen();
    const isTinyScreen = useIsSmallScreen(475);

    const tasklistTitleRef = useRef<HTMLInputElement>(null);
    const [tasklistTitle, setTasklistTitle] = useState<string | undefined>(tasklist?.title ?? "")
    const [newTaskDefault, setNewTaskDefault] = useState<string | null>(tasklist?.newItemPosition ?? "bottom")
    const [listHidden, setListHidden] = useState<boolean | undefined>(tasklist?.autoHideWhenEmpty ?? false)
    const [defaultSortOrder, setDefaultSortOrder] = useState<string | undefined | null>(tasklist?.defaultSortOrder || null)
    const [defaultFilters, setDefaultFilters] =
        useState<TasklistDefaultFilters>({
            importance: tasklist?.defaultFilters?.importance ?? "all",
            assignedToId: tasklist?.defaultFilters?.assignedToId ?? null,
            time: tasklist?.defaultFilters?.time ?? "all",
        });

    const [assignAllMembers, setAssignAllMembers] = useState<boolean>(tasklist?.allMembers ?? false);
    const [assignedMembers, setAssignedMembers] = useState<string[]>(() => {
        if (!tasklist?.members) return [];

        // Map the initial members to "Firstname Lastname" format
        return tasklist.members.map((m: any) => `${m.firstName} ${m.lastName}`);
    });
    const [activeFilters, setActiveFilters] = useState<any>();
    const [activeTaskDisplay, setActiveTaskDisplay] = useState<string>(tasklist?.viewMode ?? "regular");
    const [tasklistColor, setTasklistColor] = useState<string | undefined>(tasklist?.color)

    useEffect(() => {
        if (tasklist?.defaultFilters) {
            setActiveFilters(tasklist.defaultFilters);
        }
    }, [tasklist]);

    const updateDefaultFilter = <
        K extends keyof TasklistDefaultFilters
    >(
        key: K,
        value: TasklistDefaultFilters[K]
    ) => {
        setDefaultFilters(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    const usersData = isSmallScreen ? household.members.map((member: User) => `${member.firstName} ${member.lastName}`) : Object.fromEntries(
        household.members.map((member: User) => [
            `${member.firstName} ${member.lastName}`,
            { profileImg: member.profileImg }
        ])
    );
    useEffect(() => {
        if (tasklist?.members) {
            setAssignedMembers(
                tasklist.members.map((m: any) => `${m.firstName} ${m.lastName}`)
            );
        }
    }, [tasklist]);


    const renderMultiSelectOption: MultiSelectProps['renderOption'] = ({ option }) => (
        !isSmallScreen ? <Group gap="sm">
            <Avatar src={usersData[option.value].profileImg} size="sm" radius="xl" />
            <Text size="sm">{option.value}</Text>
        </Group> : <Text size="sm">{option.value}</Text>
    );

    const memberNames = isSmallScreen ? Object.values(usersData) : Object.keys(usersData);

    useOutsideClick(tasklistTitleRef, () => onBlurTitleInput());

    const onBlurTitleInput = () => {
        if (tasklistTitle?.trim().length === 0) setTasklistTitle(tasklist?.title);
    }

    const handleChangeTasklistTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTasklistTitle(e.target.value)
    }

    const handleChangeNewTaskDefault = (val: string | null) => {
        setNewTaskDefault(val);
    }

    const handleChangeAutoHideTasklist = (e: React.ChangeEvent<HTMLInputElement>) => {
        setListHidden(e.currentTarget.checked);
    }

    const handleChangeAssignedMembers = (val: string[]) => {
        setAssignedMembers(val);
    }

    const handleChangeAssignAllMembers = () => {
        setAssignAllMembers(prev => !prev);
    }

    const handleChangeDefaultSortOrder = (val: string | null) => {
        setDefaultSortOrder(val);
    }

    const handleChangeTasklistColor = (val: string) => {
        setTasklistColor(val)
    }

    useEffect(() => {
        console.log('tasklistColor:', tasklistColor);
    }, [tasklistColor])


    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title="Tasklist Settings"
            size="xl"
            radius="md"
            fullScreen={isSmallScreen}
            styles={{
                body: {
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    padding: 0,
                    overflow: 'hidden'
                },
                content: {
                    overflow: 'hidden',
                    maxHeight: isSmallScreen ? "100%" : "700px",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column"
                }
            }}
        >
            <Tabs
                defaultValue="general"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    minHeight: 0,
                }}
            >
                <Tabs.List
                    className="tasklist-settings-tablist"
                    style={{
                        flexShrink: 0,
                        padding: "0 16px",
                        justifyContent: "space-between",
                        alignItems: "flex-end"
                    }}
                >
                    <div style={{ display: 'flex' }}>
                        <Tabs.Tab className="tasklist-settings-tab" color="cyan" value="general">General</Tabs.Tab>
                        <Tabs.Tab className="tasklist-settings-tab" color="cyan" value="behavior">Behavior</Tabs.Tab>
                        <Tabs.Tab className="tasklist-settings-tab" color="cyan" value="appearance">Appearance</Tabs.Tab>
                    </div>
                </Tabs.List>
                <Tabs.Panel
                    value="general"
                    style={{
                        overflowY: "auto",
                        padding: "16px",
                        minHeight: 0,
                    }}

                >
                    <div className="tasklist-settings-section section-column">
                        <div className="input-label-description">
                            <Input.Label>Tasklist title</Input.Label>
                            <Input.Description>Change the title of the tasklist (max 64 characters).</Input.Description>
                        </div>
                        <Input
                            ref={tasklistTitleRef}
                            maxLength={64}
                            value={tasklistTitle}
                            onChange={handleChangeTasklistTitle}
                            placeholder="Weekend Grocery Run"
                            rightSection={
                                tasklistTitle !== ''
                                    ? <Input.ClearButton
                                        onClick={() => {
                                            setTasklistTitle('');
                                            tasklistTitleRef.current?.focus();
                                        }}
                                    />
                                    : undefined}
                            rightSectionPointerEvents="auto"
                        />
                    </div>
                    <Divider my="lg" />
                    <div className="tasklist-settings-section">
                        <div className="input-label-description">
                            <Tooltip
                                multiline
                                w={220}
                                target="#tooltip-target"
                                label="Choose whether empty tasklists (all tasks are completed, or no tasks exist) are automatically hidden."
                                events={{ hover: true, focus: true, touch: true }}
                            />
                            <Input.Label>Auto-hide empty tasklists
                                <ActionIcon variant="transparent" id="tooltip-target"><InfoIcon id="tooltip-target" width="1em" height="1em" /></ActionIcon>
                            </Input.Label>
                        </div>
                        <Switch
                            checked={listHidden}
                            color="cyan"
                            withThumbIndicator={false}
                            onChange={handleChangeAutoHideTasklist}
                            size="md"
                        />
                    </div>
                    <Divider my="lg" />
                    {household.members.length > 1 &&
                        <>
                            <div className="tasklist-settings-section">
                                <div className="input-label-description">
                                    <Input.Label>Assigned members</Input.Label>
                                    <Input.Description>
                                        Manage tasklist's assigned members.
                                    </Input.Description>
                                </div>
                                <div>
                                    <MultiSelect
                                        data={memberNames}
                                        value={assignedMembers}
                                        onChange={handleChangeAssignedMembers}
                                        renderOption={renderMultiSelectOption}
                                        maxDropdownHeight={300}
                                        placeholder="Assign members"
                                        hidePickedOptions
                                        clearable
                                        disabled={household.members?.length === 1 || assignAllMembers}
                                    />
                                    <div className="all-members-option">
                                        <Checkbox label="All members" checked={assignAllMembers} onChange={handleChangeAssignAllMembers} color="cyan" />
                                    </div>
                                </div>
                            </div>
                            <Divider my="lg" />
                        </>}
                    <div className="tasklist-settings-section">
                        <div className="input-label-description">
                            <Input.Label>Duplicate list</Input.Label>
                            <Input.Description>Create an identical copy of this tasklist.</Input.Description>
                        </div>
                        <div className="tasklist-settings-actions">
                            <Button color="cyan" variant="filled">Duplicate list</Button>
                        </div>
                    </div>
                    <div className="tasklist-settings-section">
                        <div className="input-label-description">
                            <Input.Label>Archive list</Input.Label>
                            <Input.Description>Retire the tasklist from active use.</Input.Description>
                        </div>
                        <div className="tasklist-settings-actions">
                            <Button color="cyan" variant="filled">Archive list</Button>
                        </div>
                    </div>
                    <Divider my="lg" />
                    <div className="tasklist-settings-section delete-section">
                        <div className="input-label-description">
                            <Input.Label>Delete tasklist</Input.Label>
                            <Input.Description>Delete the tasklist permanently. This cannot be undone.</Input.Description>
                        </div>
                        <Space h={12} />
                        <Button color="red.7">Delete tasklist</Button>
                    </div>
                </Tabs.Panel>
                <Tabs.Panel
                    value="behavior"
                    style={{
                        overflowY: "auto",
                        padding: "16px",
                        minHeight: 0,
                    }}
                >
                    <div className="tasklist-settings-section section-column">
                        <div className="input-label-description">
                            <Input.Label>New task default position</Input.Label>
                            <Input.Description>Choose where new tasks go by default.</Input.Description>
                        </div>
                        <Select
                            allowDeselect={false}
                            withCheckIcon={false}
                            placeholder="Select value"
                            defaultValue="Add to bottom"
                            data={[
                                { value: "top", label: "Top of list" },
                                { value: "bottom", label: "Bottom of list" }
                            ]
                            }
                            value={newTaskDefault}
                            onChange={handleChangeNewTaskDefault}
                        />
                    </div>
                    <Divider my="lg" />
                    <div className="tasklist-settings-section section-column">
                        <div className="input-label-description">
                            <Input.Label>Default sort order</Input.Label>
                            <Input.Description>
                                Set the default sort order.
                            </Input.Description>
                        </div>
                        <Select
                            placeholder="Select value"
                            defaultValue=""
                            data={[
                                { value: "due_date", label: "Due date" },
                                { value: "importance", label: "Importance" },
                                { value: "alphabetical", label: "Alphabetical" },
                                { value: "newest", label: "Newest" }
                            ]
                            }
                            value={defaultSortOrder}
                            onChange={handleChangeDefaultSortOrder}
                            clearable
                        />
                    </div>
                    <Divider my="lg" />
                    <div className="tasklist-settings-section section-column">
                        <div className="input-label-description larger">
                            <Input.Label>Default filters</Input.Label>
                            <Input.Description>Apply filters automatically.</Input.Description>
                        </div>
                        <Stack justify="space-between" className="mobile-announcements-filter-drawer">

                            {/* Importance */}
                            <Stack>
                                <Text size="sm" fw={500} c="black">Importance:</Text>
                                <Group>
                                    <Button
                                        color="cyan"
                                        size="sm"
                                        variant={defaultFilters.importance === "all" ? "filled" : "outline"}
                                        onClick={() => setDefaultFilters({ ...defaultFilters, importance: "all" })}
                                    >
                                        All
                                    </Button>
                                    <Button
                                        color="cyan"
                                        size="sm"
                                        variant={defaultFilters.importance === "important" ? "filled" : "outline"}
                                        onClick={() => setDefaultFilters({ ...defaultFilters, importance: "important" })}
                                    >
                                        Important
                                    </Button>
                                </Group>
                            </Stack>

                            {/* Creator / Assignee */}
                            <Stack className="filter-drawer-avatars">
                                <Text size="sm" fw={500} c="black">Assigned to:</Text>
                                <Group gap="xs" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
                                    {/* "All" Avatar Option */}
                                    <div
                                        style={{
                                            cursor: 'pointer',
                                            border: defaultFilters.assignedToId === null ? '2px solid var(--mantine-color-cyan-7)' : '2px solid transparent',
                                            borderRadius: '50%',
                                            padding: '2px'
                                        }}
                                        onClick={() => setDefaultFilters({ ...defaultFilters, assignedToId: null })}
                                    >
                                        <Avatar radius="xl" color="gray">All</Avatar>
                                    </div>

                                    {household.members?.map((member: User) => (
                                        <div
                                            key={member.id}
                                            style={{
                                                border: defaultFilters.assignedToId === member.id ? "2px solid var(--mantine-color-cyan-7)" : "2px solid transparent",
                                                cursor: "pointer",
                                                borderRadius: '50%',
                                                padding: '2px'
                                            }}
                                            onClick={() => setDefaultFilters({ ...defaultFilters, assignedToId: defaultFilters.assignedToId === member.id ? null : member.id })}
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
                            <Stack>
                                <Text size="sm" fw={500} c="black">Due date:</Text>
                                <Group gap="xs">
                                    {TIME_OPTIONS.map((option) => (
                                        <Button
                                            key={option.value}
                                            color="cyan"
                                            size="sm"
                                            variant={defaultFilters.time === option.value ? "filled" : "outline"}
                                            onClick={() => setDefaultFilters({ ...defaultFilters, time: option.value })}
                                        >
                                            {option.label}
                                        </Button>
                                    ))}
                                </Group>
                            </Stack>
                        </Stack>
                    </div>
                </Tabs.Panel>
                <Tabs.Panel
                    value="appearance"
                    style={{
                        flexGrow: 1,
                        overflowY: "auto",
                        padding: "16px",
                        minHeight: 0,
                    }}
                >
                    <div className="tasklist-settings-section">
                        <div className="input-label-description">
                            <Input.Label>Tasklist color</Input.Label>
                            <Input.Description>Choose this list's accent color. Accepts all valid color formats. </Input.Description>
                        </div>
                        <ColorInput
                            size="sm"
                            radius="md"
                            placeholder="Choose color"
                            defaultValue="#15aabf"
                            eyeDropperIcon={<ColorizeRoundedIcon fontSize="small" />}
                            closeOnColorSwatchClick
                            swatches={[
                                "#fa5252",
                                "#fd7e14",
                                "#fab005",
                                "#82c91e",
                                "#40c057",
                                "#12b886",
                                "#15aabf",
                                "#228be6",
                                "#4c6ef5",
                                "#7950f2",
                                "#be4bdb",
                                "#e64980",
                                "#868e96",
                                "#2e2e2e",
                            ]}
                            value={tasklistColor}
                            onChange={handleChangeTasklistColor}
                        />
                    </div>
                    <Divider my="lg" />
                    <div className="tasklist-settings-section view-tasklist-section">
                        <div className="input-label-description">
                            <Input.Label>Task Display</Input.Label>

                        </div>
                        <TaskViewSelector activeTaskDisplay={activeTaskDisplay} setActiveTaskDisplay={setActiveTaskDisplay} />
                    </div>
                </Tabs.Panel>
            </Tabs>
            <Modal.Header
                component={'footer'}
                pos={'sticky'}
                bottom={0}
                style={{ borderRadius: 0, borderTop: "1px solid var(--mantine-color-gray-3)" }}
            >
                <Group justify="flex-end" w="100%">
                    <Button color="cyan" variant="subtle" className="tasklist-settings-footer-btn">Cancel</Button>
                    <Button color="cyan" variant="filled" className="tasklist-settings-footer-btn">Update</Button>
                </Group>
            </Modal.Header>
        </Modal >
    )
}

function MiniLine({ width, height, opacity = 1, marginTop }: { width: string | number; height: string | number; opacity?: number; marginTop?: string | number; }) {
    return (
        <Box
            style={{
                width,
                height,
                backgroundColor: 'currentColor', // Uses parent text color
                opacity,
                marginTop,
                borderRadius: rem(2)
            }}
        />
    );
}

function MiniCircle({ size }: { size: string | number }) {
    return (
        <Box
            style={{
                width: size,
                height: size,
                border: '1.5px solid currentColor', // Hollow circle style
                borderRadius: '50%',
                flexShrink: 0,
                opacity: 0.4,
            }}
        />
    );
}

// --- The Task Cards ---

function RegularTask() {
    return (
        <Box py={6} px={6} style={{ borderBottom: '1px solid var(--mantine-color-gray-2)', color: 'var(--mantine-color-gray-6)' }}>
            <Flex align="flex-start" gap={6}>

                {/* Checkbox (Top aligned) */}
                <MiniCircle size={10} />

                {/* Middle Content */}
                <Stack gap={4} style={{ flex: 1 }}>
                    {/* Main Task Text (Skinnier height=6) */}
                    <MiniLine width="85%" height={6} opacity={0.6} marginTop="2px" />

                    {/* Metadata Row */}
                    <Flex gap={4} align="center" style={{ opacity: 0.4 }}>
                        <MiniLine width={8} height={8} /> {/* Icon Box */}
                        <MiniLine width={24} height={4} /> {/* Text Line */}
                        <Box w={4} /> {/* Spacer */}
                        <MiniLine width={8} height={8} /> {/* Icon Box */}
                        <MiniLine width={24} height={4} /> {/* Text Line */}
                    </Flex>
                </Stack>

                {/* Real Star Icon (Top aligned) */}
                <StarIcon size={10} />
            </Flex>
        </Box>
    );
}

function CompactTask() {
    return (
        <Box py={4} px={6} style={{ borderBottom: '1px solid var(--mantine-color-gray-2)', color: 'var(--mantine-color-gray-6)' }}>
            <Flex align="center" gap={10}>
                {/* Checkbox */}
                <MiniCircle size={10} />

                {/* Task Text */}
                <Box style={{ flex: 1 }}>
                    <MiniLine width="65%" height={6} opacity={0.6} />
                </Box>

                {/* Real Star Icon */}
                <StarIcon size={10} />
            </Flex>
        </Box>
    );
}

// --- Main Container ---

function PreviewWindow({ label, onClick, activeTaskDisplay, children }: { label: string; onClick: () => void; activeTaskDisplay: string; children: React.ReactNode }) {
    console.log(activeTaskDisplay === label)
    return (
        <Stack gap="0.25rem">
            <Box style={{
                border: activeTaskDisplay === label.toLowerCase() ? "2px solid var(--mantine-color-cyan-6)" : "2px solid transparent",
                borderRadius: "var(--mantine-radius-md)",
                padding: "2px",
            }}
                onClick={onClick}>
                <Box
                    style={{
                        width: rem(180),
                        height: rem(125),
                        border: '1px solid var(--mantine-color-gray-3)',
                        borderRadius: 'var(--mantine-radius-md)',
                        backgroundColor: 'white',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {children}
                </Box>
            </Box>
            <Group gap="0.5rem" align="center" ml={5}>
                <Checkbox color="cyan" checked={activeTaskDisplay === label.toLowerCase()} size="xs" radius="xl" />
                <Text size="xs" fw={500} c="black" mt={1}>{label}</Text>
            </Group>
        </Stack>
    );
}

export function TaskViewSelector({ activeTaskDisplay, setActiveTaskDisplay }: { activeTaskDisplay: string; setActiveTaskDisplay: React.Dispatch<SetStateAction<string>> }) {
    const isSmallScreen = useIsSmallScreen();
    return (
        <Flex m="auto" gap={isSmallScreen ? 20 : 30} justify="center" wrap="wrap">
            <PreviewWindow label="Regular" onClick={() => setActiveTaskDisplay("regular")} activeTaskDisplay={activeTaskDisplay}>
                <RegularTask />
                <RegularTask />
                <RegularTask />
                <Box style={{ opacity: "0.5" }} ><RegularTask /></Box>
            </PreviewWindow>

            <PreviewWindow label="Compact" onClick={() => setActiveTaskDisplay("compact")} activeTaskDisplay={activeTaskDisplay}>
                <CompactTask />
                <CompactTask />
                <CompactTask />
                <CompactTask />
                <CompactTask />
                <CompactTask />
                <Box style={{ opacity: "0.5" }} ><CompactTask /></Box>
            </PreviewWindow>
        </Flex>
    );
}