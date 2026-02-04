import { Button, Group, Modal, Tabs } from "@mantine/core";
import { useTasklistSettings } from "../../hooks/useTasklistSettings";
import { GeneralTab } from "./GeneralTab";
import { BehaviorTab } from "./BehaviorTab";
import { AppearanceTab } from "./AppearanceTab";
import { DiscardWarning } from "./DiscardWarning";
import { isTooLight } from "../../utils/isTooLight";
import { useParams } from "react-router-dom";
import { useIsSmallScreen } from "@/hooks";

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
    const { tasklistId } = useParams();
    const isSmallScreen = useIsSmallScreen();
    const {
        form,
        tasklist,
        household,
        handleClose,
        setShowDiscardWarning,
        showDiscardWarning,
        handleDiscardConfirmation,
        resetToDefault,
        isSubmitting,
        handleSubmit,
        showDeleteConfirmation,
        allowedMembers,
    } = useTasklistSettings({ setShowTasklistSettings, tasklistId: Number(tasklistId) });

    const hasColorError = isTooLight(form.values.color);

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
            closeOnEscape={(!showDiscardWarning && !showDeleteConfirmation)}
        >
            <Tabs defaultValue="general" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
                <Tabs.List className="tasklist-settings-tablist" style={{ flexShrink: 0, padding: "0 16px", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div style={{ display: 'flex' }}>
                        <Tabs.Tab className="tasklist-settings-tab" color="var(--tasklist-color)" value="general">General</Tabs.Tab>
                        <Tabs.Tab className="tasklist-settings-tab" color="var(--tasklist-color)" value="behavior">Behavior</Tabs.Tab>
                        <Tabs.Tab className="tasklist-settings-tab" color="var(--tasklist-color)" value="appearance">Appearance</Tabs.Tab>
                    </div>
                </Tabs.List>
                <GeneralTab
                    form={form}
                    tasklist={tasklist}
                    tasklistId={tasklist?.id}
                    household={household}
                />
                <BehaviorTab form={form} household={household} allowedMembers={allowedMembers} />
                <AppearanceTab form={form} />
            </Tabs>

            <Modal.Header component={'footer'} pos={'sticky'} bottom={0} style={{ borderRadius: 0, borderTop: "1px solid var(--mantine-color-gray-3)" }}>
                <Group justify="space-between" w="100%">
                    <Button size="compact-sm" variant="transparent" color="var(--tasklist-color)" onClick={resetToDefault}>Reset to default</Button>
                    <Group gap="0.5rem">
                        <Button
                            color="var(--tasklist-color)"
                            variant="outline"
                            className="tasklist-settings-footer-btn"
                            onClick={() => form.reset()}
                            disabled={!form.isDirty() || !form.isValid() || hasColorError}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="var(--tasklist-color)"
                            variant="filled"
                            className="tasklist-settings-footer-btn"
                            disabled={!form.isDirty() || !form.isValid() || hasColorError}
                            onClick={() => handleSubmit()}
                            loading={isSubmitting}
                            loaderProps={{ children: 'Saving...' }}
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
