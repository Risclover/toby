import { InfoIcon } from "@/assets/icons/InfoIcon";
import type { User } from "@/store/authSlice";
import { ActionIcon, Button, Checkbox, Divider, Input, MultiSelect, Space, Switch, Tabs, Tooltip, type MultiSelectProps } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import type { RefObject } from "react";
import { SettingsItem } from "./SettingsItem";

export type TasklistFormValues = {
    title: string;
    autoHideWhenEmpty: boolean;
    newItemPosition: string;
    starsAtTop: boolean;
    defaultSortOrder: string | null;
    color: string;
    viewMode: string;
    memberIds: string[];
    allMembers: boolean;
    defaultFilters: {
        importance: "all" | "important";
        assignedToId: number | null;
        time: "past_due" | "today" | "tomorrow" | "this_week" | "this_month" | "all";
    };
};

export type TasklistSettingsForm = UseFormReturnType<TasklistFormValues>;

type GeneralTabProps = {
    form: TasklistSettingsForm;
    household: { members: User[] }; // Replace with actual Household type if different
    memberOptions: { value: string; label: string }[];
    renderMultiSelectOption: MultiSelectProps['renderOption'];
    isSmallScreen: boolean;
    titleRef: RefObject<HTMLInputElement | null>;
    onToggleAll: (checked: boolean) => void;
    onMemberChange: (values: string[]) => void;
};

export const GeneralTab = ({ form, household, memberOptions, renderMultiSelectOption, isSmallScreen, titleRef, onToggleAll, onMemberChange }: GeneralTabProps) => {
    // Logic to match original immediate error behavior
    const hasMemberError = form.values.memberIds.length === 0;

    return (
        <Tabs.Panel value="general" style={{ overflowY: "auto", padding: "16px", minHeight: 0 }}>
            <SettingsItem
                layout="column"
                label="Tasklist title"
                description="Change the title of the tasklist (max 64 characters)."
                divider={true}
            >
                <div className={!isSmallScreen ? "tasklist-settings-right" : ""}>
                    <Input
                        id="title"
                        ref={titleRef}
                        maxLength={64}
                        placeholder="Weekend Grocery Run"
                        // Spread Mantine props first
                        {...form.getInputProps('title')}
                        // Override/Extend onBlur
                        rightSection={
                            form.values.title !== '' ? (
                                <Input.ClearButton onClick={() => {
                                    form.setFieldValue('title', '');
                                    titleRef.current?.focus();
                                }}
                                />
                            ) : undefined
                        }
                        rightSectionPointerEvents="auto"
                    />
                </div>
            </SettingsItem>
            <div className="tasklist-settings-section">
                <div className="input-label-description">
                    <Tooltip
                        multiline
                        w={220}
                        target="#tooltip-target"
                        label="Choose whether empty tasklists (all tasks are completed, or no tasks exist) are automatically hidden."
                        events={{ hover: true, focus: true, touch: true }}
                    />
                    <Input.Label>
                        Auto-hide empty tasklists
                        <ActionIcon variant="transparent" id="tooltip-target">
                            <InfoIcon id="tooltip-target" width="1em" height="1em" />
                        </ActionIcon>
                    </Input.Label>
                </div>
                <Switch
                    {...form.getInputProps('autoHideWhenEmpty', { type: 'checkbox' })}
                    color="cyan"
                    size="md"
                    withThumbIndicator={false}
                />
            </div>
            <Divider my="lg" />
            {household.members.length > 1 && (
                <SettingsItem
                    layout="column"
                    label="Assigned members"
                    labelRequired={hasMemberError}
                    error="You must assign at least one member."
                    errorBool={hasMemberError}
                    description="Manage tasklist's assigned members."
                    divider={true}
                >
                    <div className="tasklist-settings-right">
                        <MultiSelect
                            data={memberOptions}
                            value={form.values.memberIds}
                            onChange={onMemberChange}
                            renderOption={renderMultiSelectOption}
                            maxDropdownHeight={300}
                            placeholder="Assign members"
                            id="assigned"
                            hidePickedOptions
                            clearable
                        />
                        <div className="all-members-option">
                            <Checkbox
                                label="All members"
                                checked={form.values.allMembers}
                                onChange={(e) => onToggleAll(e.currentTarget.checked)}
                                color="cyan"
                            />
                        </div>
                    </div>
                </SettingsItem>
            )}
            <SettingsItem
                layout="row"
                label="Duplicate list"
                description="Create an identical copy of this tasklist."
                divider={false}
            >
                <Button color="cyan" variant="filled">Duplicate list</Button>
            </SettingsItem>
            <SettingsItem
                layout="row"
                label="Archive list"
                description="Retire the tasklist from active use."
                divider={true}
            >
                <Button color="cyan" variant="filled">Archive list</Button>
            </SettingsItem>
            <SettingsItem
                layout="delete"
                label="Delete tasklist"
                description="Delete the tasklist permanently. This cannot be undone."
                divider={false}
            >
                <Space h={12} />
                <Button color="red.7">Delete tasklist</Button>
            </SettingsItem>
        </Tabs.Panel>
    );
};