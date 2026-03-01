import { SettingsItem, TaskViewSelector } from "@/features"
import { useIsSmallScreen } from "@/hooks"
import { useAuthenticateQuery, useGetHouseholdTasklistsQuery, useGetTasklistsQuery } from "@/store";
import { useGetUserSettingsQuery, type FeaturedListView, type FeaturedTasklistSettings } from "@/store/userSettingSlice";
import { Button, Checkbox, Collapse, Divider, FloatingIndicator, Group, Input, Loader, Select, Space, Switch, Tabs, Text, UnstyledButton } from "@mantine/core"
import type { UseFormReturnType } from "@mantine/form";
import React, { useState } from "react";
import { data } from "react-router-dom";
import { MaxTaskCountPicker } from "./MaxTaskCountPicker";
import "./FeaturedListSettings.css"
import { FeaturedTasklistTabUrgencyFilter } from "./FeaturedTasklistTabUrgencyFilter";
import { SettingsSection } from "./SettingsSection";
import { useCreateTasklistModal } from "@/contexts";


export type FeaturedTasklistSettingsForm = UseFormReturnType<FeaturedTasklistSettings>;

type Props = {
    form: FeaturedTasklistSettingsForm;
    handleClose: () => void;
}


export const FeaturedTasklistTab = ({ form, handleClose }: Props) => {
    const { openModal } = useCreateTasklistModal();
    const isSmallScreen = useIsSmallScreen();
    const { data: user } = useAuthenticateQuery();
    const {
        data: tasklists,
        isLoading: isLoadingTasklists
    } = useGetHouseholdTasklistsQuery(user?.householdId);

    const userTasklists = tasklists?.filter(tasklist => tasklist.memberIds?.includes(user.id) || tasklist.allMembers);
    const { overdue, dueToday, dueSoon } = form.values.urgencyFilter;
    const [showUrgencyFilters, setShowUrgencyFilters] = useState(overdue || dueToday || dueSoon);
    const handleUrgencySwitch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.currentTarget.checked;
        setShowUrgencyFilters(isChecked);
        if (!isChecked) {
            form.setFieldValue("urgencyFilter.overdue", false);
            form.setFieldValue("urgencyFilter.dueToday", false);
            form.setFieldValue("urgencyFilter.dueSoon", false);
        }
    }

    const selectData = userTasklists?.map(t => ({
        value: t.id.toString(), // The ID you want to save
        label: t.title          // The text the user sees
    })) || [];

    if (isLoadingTasklists) {
        return <Loader size="sm" />; // Or return null
    }

    // Now we know data is loaded.
    // Check if the list is EMPTY, not if a specific one is SELECTED.
    const hasTasklists = tasklists && tasklists.length > 0;

    return (
        <Tabs.Panel value="tasks" style={{ overflowY: "auto", padding: isSmallScreen ? "1.5rem 0.75rem" : "1.75rem 1.25rem", minHeight: 0 }}>
            <SettingsSection title="tasklist">
                <SettingsItem
                    layout="column"
                    label="Featured tasklist"
                    description="Switch which tasklist is featured."
                    divider={false}
                >
                    <div className={!isSmallScreen ? "tasklist-settings-right" : ""}>
                        {userTasklists && userTasklists.length > 0 ? (
                            <Select
                                styles={{
                                    input: {
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }
                                }}
                                w="100%"
                                maw={390}
                                className="truncate-select"
                                clearable
                                placeholder="Pick a tasklist"
                                data={userTasklists.map(t => ({ value: t.id.toString(), label: t.title }))}
                                {...form.getInputProps("featuredTasklistId")}
                                // Ensure we handle null/empty values correctly
                                value={form.values.featuredTasklistId ? form.values.featuredTasklistId.toString() : null}
                                onChange={(val) => {
                                    // Handle conversion back to number or null
                                    const numericVal = val ? Number(val) : null;
                                    form.setFieldValue("featuredTasklistId", numericVal);
                                }}
                            />
                        ) : (
                            <div className="no-tasklists-msg">
                                Whoops! You don't have any tasklists. Want to <UnstyledButton className="create-tasklist-hint" onClick={() => { handleClose(); openModal() }}>create one</UnstyledButton>?
                            </div>
                        )}
                    </div>
                </SettingsItem>
                <SettingsItem
                    layout="row"
                    label="Auto-rotate when complete"
                    description="Automatically feature the next list"
                    divider={true}
                >
                    <Switch
                        color="var(--tasklist-color)"
                        size="md"
                        withThumbIndicator={false}
                        {...form.getInputProps('rotation', { type: 'checkbox' })}
                    />
                </SettingsItem>
            </SettingsSection>
            <SettingsSection title="filtering">
                <SettingsItem
                    layout="row"
                    label="Mine only"
                    description="Tasks shown are assigned only to you"
                    divider={false}
                >
                    <Switch
                        color="var(--tasklist-color)"
                        size="md"
                        withThumbIndicator={false}
                        {...form.getInputProps('justMeFilter', { type: 'checkbox' })}
                    />
                </SettingsItem>
                <SettingsItem
                    layout="row"
                    label="Important only"
                    description="Hide tasks not marked important"
                    divider={false}
                >
                    <Switch
                        color="var(--tasklist-color)"
                        size="md"
                        withThumbIndicator={false}
                        {...form.getInputProps('importantOnly', { type: 'checkbox' })}
                    />
                </SettingsItem>
                <SettingsItem
                    layout="row"
                    label="Filter by urgency"
                    description="Only show tasks matching selected states"
                    divider={true}
                    collapse={true}
                    showUrgencyFilters={showUrgencyFilters}
                    form={form}
                >
                    <Switch
                        onChange={handleUrgencySwitch}
                        color="var(--tasklist-color)"
                        size="md"
                        withThumbIndicator={false}
                        checked={showUrgencyFilters}
                    />
                </SettingsItem>
            </SettingsSection>
            <SettingsSection title="display">
                <SettingsItem
                    layout="row"
                    label="Show completed tasks"
                    description="Keep checked-off tasks visible"
                    divider={false}
                >
                    <Switch
                        color="var(--tasklist-color)"
                        size="md"
                        withThumbIndicator={false}
                        {...form.getInputProps('showCompleted', { type: 'checkbox' })}
                    />
                </SettingsItem>
                <SettingsItem
                    layout="row"
                    label="Show progress bar"
                    description="Display tasklist progress (completion %)"
                    divider={false}
                >
                    <Switch
                        color="var(--tasklist-color)"
                        size="md"
                        withThumbIndicator={false}
                        {...form.getInputProps('showProgress', { type: 'checkbox' })}
                    />
                </SettingsItem>
                <SettingsItem
                    layout="row"
                    label="Show quick-add bar"
                    description="Display task input field at the bottom"
                    divider={false}
                >
                    <Switch
                        color="var(--tasklist-color)"
                        size="md"
                        withThumbIndicator={false}
                        {...form.getInputProps('showQuickAdd', { type: 'checkbox' })}
                    />
                </SettingsItem>
                <div className="tasklist-settings-section view-tasklist-section">
                    <div className="input-label-description">
                        <Input.Label>View</Input.Label>
                        <Input.Description>Choose if additional details are shown</Input.Description>
                    </div>
                    <Space h="xs" />
                    <TaskViewSelector
                        activeTaskDisplay={form.values.view}
                        setActiveTaskDisplay={(val: FeaturedListView | string) => form.setFieldValue('view', val)}
                    />
                </div>
                <Divider my="lg" />
            </SettingsSection>
            <SettingsSection title="ordering & limits">
                <SettingsItem
                    layout="column"
                    label="Sort order"
                    description="Set the task order"
                    divider={false}
                >
                    <Select
                        allowDeselect={false}
                        defaultValue="manual"
                        placeholder="Sort by"
                        {...form.getInputProps('sortOrder')}
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
                    label="Maximum tasks shown"
                    description="Cap the number of visible tasks"
                    divider={false}
                >
                    <div className={!isSmallScreen ? "tasklist-settings-right" : ""}>
                        <MaxTaskCountPicker value={form.values.maxItems}
                            onChange={(val) => form.setFieldValue('maxItems', val)} />
                    </div>
                </SettingsItem>
            </SettingsSection>
        </Tabs.Panel>
    )
}