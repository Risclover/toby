// ShoppingListSettingsGeneralTab.tsx
import { Button, Checkbox, Flex, Group, Input, MultiSelect, Space, Tabs, Text, TextInput, type MultiSelectProps } from "@mantine/core";
import { SettingsItem } from "@/components/SettingsItem";
import { DeleteConfirmation } from "@/components";
import { FormColorInput } from "@/components/FormColorInput";
import { useIsSmallScreen } from "@/hooks";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import type { useShoppingListSettings } from "../../hooks/useShoppingListSettings";

type Props = ReturnType<typeof useShoppingListSettings>;

export const ShoppingListSettingsGeneralTab = ({
    form,
    list,
    household,
    titleRef,
    memberOptions,
    renderMultiSelectOption,
    handleToggleAllMembers,
    handleMemberChange,
    handleTitleBlur,
    handleArchiveList,
    handleUndoArchive,
    handleDuplicateList,
    handleDeleteList,
    handleCheckAll,
    handleUncheckAll,
    showDeleteConfirmation,
    setShowDeleteConfirmation,
}: Props) => {
    const isSmallScreen = useIsSmallScreen();
    const hasMemberError = form.values.memberIds.length === 0;

    return (
        <Tabs.Panel value="general" style={{ overflowY: "auto", padding: "16px", minHeight: 0 }}>
            <SettingsItem
                layout="column"
                label="List title"
                description="Change the title of this shopping list (max 30 characters)."
                divider={true}
            >
                <TextInput
                    ref={titleRef}
                    maxLength={30}
                    placeholder="Weekend Grocery Run"
                    {...form.getInputProps("title")}
                    onBlur={handleTitleBlur}
                    rightSection={
                        form.values.title !== "" ? (
                            <Input.ClearButton
                                onClick={() => {
                                    form.setFieldValue("title", "");
                                    titleRef.current?.focus();
                                }}
                            />
                        ) : undefined
                    }
                    rightSectionPointerEvents="auto"
                />
            </SettingsItem>

            <SettingsItem
                layout="column"
                label="List color"
                description="Choose this list's accent color."
                divider={true}
            >
                <FormColorInput form={form} />
            </SettingsItem>

            {household?.members?.length > 1 && (
                <SettingsItem
                    layout="column"
                    label="Assigned members"
                    labelRequired={hasMemberError}
                    error="You must assign at least one member."
                    errorBool={hasMemberError}
                    description="Manage this list's assigned members."
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
                            hidePickedOptions
                            clearable
                            c="black"
                        />
                        <div className="all-members-option">
                            <Checkbox
                                label="All members"
                                checked={form.values.allMembers}
                                onChange={(e) => handleToggleAllMembers(e.currentTarget.checked)}
                                color={list.color}
                            />
                        </div>
                    </Flex>
                </SettingsItem>
            )}

            <SettingsItem
                layout="column"
                label="Bulk actions"
                description="Quickly check or uncheck all items in the list."
                divider={true}
            >
                <Group gap="xs">
                    <Button
                        variant="outline"
                        color={list.color}
                        size="sm"
                        fw={500}
                        leftSection={<CheckCircleOutlineRoundedIcon fontSize="small" />}
                        onClick={handleCheckAll}
                    >
                        Check all
                    </Button>
                    <Button
                        variant="outline"
                        color={list.color}
                        size="sm"
                        fw={500}
                        leftSection={<RadioButtonUncheckedRoundedIcon fontSize="small" />}
                        onClick={handleUncheckAll}
                    >
                        Uncheck all
                    </Button>
                </Group>
            </SettingsItem>

            <SettingsItem
                layout="delete"
                label="Duplicate list"
                description="Create an identical copy of this shopping list."
                divider={false}
            >
                <Space h={12} />
                <Button color={list.color} variant="filled" onClick={handleDuplicateList} fw={500}>
                    Duplicate list
                </Button>
            </SettingsItem>

            <SettingsItem
                layout="delete"
                label="Archive list"
                description="Retire this list from active use."
                divider={true}
            >
                <Space h={12} />
                {list.isArchived ? (
                    <Button color={list.color} variant="filled" onClick={handleUndoArchive} fw={500}>
                        Unarchive list
                    </Button>
                ) : (
                    <Button color={list.color} variant="filled" onClick={handleArchiveList} fw={500}>
                        Archive list
                    </Button>
                )}
            </SettingsItem>

            <SettingsItem
                layout="delete"
                label="Delete list"
                description="Permanently delete this shopping list. This cannot be undone."
                divider={false}
            >
                <Space h={12} />
                <Button color="red.7" fw={500} onClick={() => setShowDeleteConfirmation(true)}>
                    Delete list
                </Button>
            </SettingsItem>

            {showDeleteConfirmation && (
                <DeleteConfirmation
                    itemName={list.title}
                    itemType="shopping list"
                    modalTitle="Confirm delete shopping list"
                    opened={showDeleteConfirmation}
                    setShowDeleteConfirmation={setShowDeleteConfirmation}
                    handleDeleteItem={handleDeleteList}
                />
            )}
        </Tabs.Panel>
    );
};