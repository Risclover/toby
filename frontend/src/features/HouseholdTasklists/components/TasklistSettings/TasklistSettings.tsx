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
    setShowTasklistSettings: () => void;
};

export const TasklistSettings = ({ opened, setShowTasklistSettings }: Props) => {
    const {
        form,
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
        handleDiscardConfirmation
    } = useTasklistSettings({ opened, setShowTasklistSettings });

    // Handle Form Submission
    const handleSubmit = (values: TasklistFormValues) => {
        console.log("Submitting values:", values);
        // Call your update mutation here...
        // updateTasklist(values);
        form.resetDirty(); // Optional: reset dirty state after success
        handleClose();
    };

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title="Tasklist Settings"
            size="xl"
            radius="md"
            fullScreen={isSmallScreen}
            styles={{ body: { padding: 0 } }}
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
                <Group justify="flex-end" w="100%">
                    <Button
                        color="cyan"
                        variant="subtle"
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
                        onClick={() => handleSubmit(form.values)}
                    >
                        Update
                    </Button>
                </Group>
            </Modal.Header>
            {showDiscardWarning && <DiscardWarning opened={showDiscardWarning} setShowDiscardWarning={setShowDiscardWarning} handleClose={() => {
                setShowDiscardWarning(false);
                handleDiscardConfirmation();
            }} />}
        </Modal>
    );
};
