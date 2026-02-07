import type { User } from "@/store/authSlice";
import { Button, Checkbox, Flex, Input, MultiSelect, Space, Switch, Tabs } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { SettingsItem } from "./SettingsItem";
import { type TasklistType } from "@/store/taskSlice";
import { DeleteConfirmation } from "./DeleteConfirmation";
import { useTasklistSettings } from "../../hooks";
import { useIsSmallScreen } from "@/hooks";

export type TasklistFormValues = {
    title: string;
    showCompleted: boolean;
    newItemPosition: string;
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


// Define the Props interface to include everything we are passing down
interface GeneralTabProps {
    form: any; // Ideally replace 'any' with your actual Form type
    tasklist: any;
    tasklistId: number;
    household: any;
    // New props from the hook:
    memberOptions: any[];
    renderMultiSelectOption: any;
    tasklistTitleRef: React.RefObject<HTMLInputElement>;
    handleToggleAllMembers: (checked: boolean) => void;
    handleMemberChange: (values: string[]) => void;
    showDeleteConfirmation: boolean;
    setShowDeleteConfirmation: (show: boolean) => void;
    handleArchiveList: () => void;
    handleUndoArchive: () => void;
    handleDuplicateList: () => void;
    handleDeleteList: () => void;
    handleTitleBlur: () => void;
}

export const GeneralTab = ({
    form,
    tasklist,
    tasklistId,
    household,
    memberOptions,
    renderMultiSelectOption,
    tasklistTitleRef,
    handleToggleAllMembers,
    handleMemberChange,
    showDeleteConfirmation,
    setShowDeleteConfirmation,
    handleArchiveList,
    handleUndoArchive,
    handleDuplicateList,
    handleDeleteList,
    handleTitleBlur
}: GeneralTabProps) => {

    const isSmallScreen = useIsSmallScreen();
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
                        ref={tasklistTitleRef}
                        maxLength={64}
                        onBlur={handleTitleBlur}
                        placeholder="Weekend Grocery Run"
                        // Spread Mantine props first
                        {...form.getInputProps('title')}
                        // Override/Extend onBlur
                        rightSection={
                            form.values.title !== '' ? (
                                <Input.ClearButton onClick={() => {
                                    form.setFieldValue('title', '');
                                    tasklistTitleRef.current?.focus();
                                }}
                                />
                            ) : undefined
                        }
                        rightSectionPointerEvents="auto"
                    />
                </div>
            </SettingsItem>
            <SettingsItem
                layout="row"
                label="Show completed tasks"
                description="Choose whether the 'Completed' section remains open."
                divider={true}
            >
                <Switch
                    {...form.getInputProps('showCompleted', { type: 'checkbox' })}
                    color="var(--tasklist-color)"
                    size="md"
                    withThumbIndicator={false}
                />
            </SettingsItem>
            {household?.members?.length > 1 && (
                <SettingsItem
                    layout="column"
                    label="Assigned members"
                    labelRequired={hasMemberError}
                    error="You must assign at least one member."
                    errorBool={hasMemberError}
                    description="Manage tasklist's assigned members."
                    divider={true}
                >
                    <Flex direction="column">
                        <MultiSelect
                            data={memberOptions}
                            value={form.values.memberIds}
                            onChange={handleMemberChange}
                            renderOption={renderMultiSelectOption}
                            maxDropdownHeight={300}
                            placeholder="Assign members"
                            id="assigned"
                            hidePickedOptions
                            clearable
                            c="black"
                        />
                        <div className="all-members-option">
                            <Checkbox
                                label="All members"
                                checked={form.values.allMembers}
                                onChange={(e) => handleToggleAllMembers(e.currentTarget.checked)}
                                color="var(--tasklist-color)"
                            />
                        </div>
                    </Flex>
                </SettingsItem>
            )}
            <SettingsItem
                layout="delete"
                label="Duplicate list"
                description="Create an identical copy of this tasklist."
                divider={false}
            >
                <Space h={12} />
                <Button color="var(--tasklist-color)" variant="filled" onClick={handleDuplicateList}>Duplicate list</Button>
            </SettingsItem>
            <SettingsItem
                layout="delete"
                label="Archive list"
                description="Retire the tasklist from active use."
                divider={true}
            >
                <Space h={12} />
                {tasklist?.isArchived ?
                    <Button color="var(--tasklist-color)" variant="filled" onClick={handleUndoArchive}>Unarchive list</Button> :
                    <Button color="var(--tasklist-color)" variant="filled" onClick={handleArchiveList}>Archive list</Button>
                }
            </SettingsItem>
            <SettingsItem
                layout="delete"
                label="Delete tasklist"
                description="Delete the tasklist permanently. This cannot be undone."
                divider={false}
            >
                <Space h={12} />
                <Button color="red.7" onClick={() => setShowDeleteConfirmation(true)}>Delete tasklist</Button>
            </SettingsItem>
            {showDeleteConfirmation && <DeleteConfirmation title={form.values.title} opened={showDeleteConfirmation} setShowDeleteConfirmation={setShowDeleteConfirmation} handleDeleteList={handleDeleteList} />}
        </Tabs.Panel>
    );
};