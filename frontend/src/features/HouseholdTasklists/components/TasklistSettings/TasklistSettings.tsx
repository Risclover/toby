import { Button, Group, Modal, Tabs } from "@mantine/core";
import { useTasklistSettings, type TasklistFormValues } from "../../hooks/useTasklistSettings";
import { GeneralTab } from "./GeneralTab";
import { BehaviorTab } from "./BehaviorTab";
import { AppearanceTab } from "./AppearanceTab";
import { DiscardWarning } from "./DiscardWarning";

/* --- SHARED CONSTANTS --- */
export const TIME_OPTIONS = [
    { label: "Past due", value: "past_due" },
    { label: "Today", value: "today" },
    { label: "Tomorrow", value: "tomorrow" },
    { label: "This week", value: "this_week" },
    { label: "This month", value: "this_month" },
    { label: "All", value: "all" },
] as const;

type Props = {
    opened: boolean;
    setShowTasklistSettings: (val: boolean) => void;
};

export const TasklistSettings = ({ opened, setShowTasklistSettings }: Props) => {
    const {
        form,
        tasklist,
        household,
        isSmallScreen,
        tasklistTitleRef,
        memberOptions,
        renderMultiSelectOption,
        handleToggleAllMembers,
        handleMemberChange,
        handleClose,
        setShowDiscardWarning,
        showDiscardWarning,
        handleDiscardConfirmation,
        updateTasklist,
        resetToDefault
    } = useTasklistSettings({ setShowTasklistSettings });

    // Handle Form Submission
    const handleSubmit = async () => {
        // Validate first
        if (!form.isValid()) {
            form.validate();
            return;
        }

        // Transform form values to match your API shape
        const payload = {
            title: form.values.title,
            autoHideWhenEmpty: form.values.autoHideWhenEmpty, // <- This boolean should now work
            newItemPosition: form.values.newItemPosition,
            starsAtTop: form.values.starsAtTop,
            defaultSortOrder: form.values.defaultSortOrder,
            color: form.values.color,
            viewMode: form.values.viewMode,
            allMembers: form.values.allMembers,
            memberIds: form.values.memberIds.map(Number), // Convert strings back to numbers
            defaultFilters: {
                importance: form.values.defaultFilters.importance,
                assignedToId: form.values.defaultFilters.assignedToId,
                time: form.values.defaultFilters.time,
            },
        };

        try {
            // Replace this with your actual mutation hook
            await updateTasklist({ listId: Number(tasklist?.id), data: payload }).unwrap();
            console.log("Submitting:", payload);

            form.resetDirty(); // Mark form as clean
            handleClose();
        } catch (error) {
            console.error("Failed to update tasklist:", error);
            // Optionally show error notification
        }
    };
    console.log('tasklist:', tasklist)
    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title="Tasklist Settings"
            size="xl"
            radius="md"
            fullScreen={isSmallScreen}
            styles={{
                body: { display: "flex", flexDirection: "column", height: "100%", padding: 0, overflow: 'hidden' },
                content: { overflow: 'hidden', maxHeight: isSmallScreen ? "100%" : "700px", height: "100%", display: "flex", flexDirection: "column" }
            }}
        >
            <Tabs defaultValue="general" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
                <Tabs.List className="tasklist-settings-tablist" style={{ flexShrink: 0, padding: "0 16px", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div style={{ display: 'flex' }}>
                        <Tabs.Tab className="tasklist-settings-tab" color="cyan" value="general">General</Tabs.Tab>
                        <Tabs.Tab className="tasklist-settings-tab" color="cyan" value="behavior">Behavior</Tabs.Tab>
                        <Tabs.Tab className="tasklist-settings-tab" color="cyan" value="appearance">Appearance</Tabs.Tab>
                    </div>
                </Tabs.List>
                <GeneralTab
                    form={form}
                    household={household}
                    isSmallScreen={isSmallScreen}
                    memberOptions={memberOptions}
                    renderMultiSelectOption={renderMultiSelectOption}
                    titleRef={tasklistTitleRef}
                    onToggleAll={handleToggleAllMembers}
                    onMemberChange={handleMemberChange}
                />
                <BehaviorTab form={form} household={household} />
                <AppearanceTab form={form} />
            </Tabs>

            <Modal.Header component={'footer'} pos={'sticky'} bottom={0} style={{ borderRadius: 0, borderTop: "1px solid var(--mantine-color-gray-3)" }}>
                <Group justify="space-between" w="100%">
                    <Button size="compact-sm" variant="transparent" color="cyan" onClick={resetToDefault}>Reset to default</Button>
                    <Group gap="0.5rem">
                        <Button
                            color="cyan"
                            variant="outline"
                            className="tasklist-settings-footer-btn"
                            onClick={() => form.reset()} // Simple reset!
                        >
                            Cancel
                        </Button>
                        <Button
                            color="cyan"
                            variant="filled"
                            className="tasklist-settings-footer-btn"
                            disabled={!form.isDirty() || !form.isValid()} // Built-in helpers
                            onClick={() => handleSubmit()}
                        >
                            Update
                        </Button>
                    </Group>
                </Group>
            </Modal.Header>
            {
                showDiscardWarning && <DiscardWarning opened={showDiscardWarning} setShowDiscardWarning={setShowDiscardWarning} handleClose={() => {
                    setShowDiscardWarning(false);
                    handleDiscardConfirmation();
                }} />
            }
        </Modal>
    );
};
