import { useIsSmallScreen } from "@/hooks";
import { useSettingsModal } from "@/hooks/useSettingsModal";
import { useAuthenticateQuery, useGetFeaturedListSettingsQuery, useUpdateFeaturedListSettingsMutation, type FeaturedTasklistSettings } from "@/store";
import { Button, Group, Modal, Tabs } from "@mantine/core"
import { FeaturedTasklistTab } from "./FeaturedTasklistTab";
import { DiscardWarning } from "@/features";
import { useEffect, useMemo, useState } from "react";

type Props = {
    opened: boolean;
    setShowFeaturedListSettings: (val: boolean) => void;
}
export const FeaturedListSettings = ({ opened, setShowFeaturedListSettings }: Props) => {
    const isSmallScreen = useIsSmallScreen();
    const { data: user } = useAuthenticateQuery();
    const [updateUserSettings] = useUpdateFeaturedListSettingsMutation();
    const { data: userSettings } = useGetFeaturedListSettingsQuery();

    const [activeTab, setActiveTab] = useState<string | null>("tasks");
    const [pendingTab, setPendingTab] = useState<string | null>(null);

    const initialValues = useMemo<FeaturedTasklistSettings>(() => ({
        tasklistId: userSettings?.featuredTasklist.tasklistId ?? null,
        justMeFilter: userSettings?.featuredTasklist.justMeFilter ?? false,
        urgencyFilter: {
            overdue: userSettings?.featuredTasklist.urgencyFilter.overdue ?? false,
            dueToday: userSettings?.featuredTasklist.urgencyFilter.dueToday ?? false,
            dueSoon: userSettings?.featuredTasklist.urgencyFilter.dueSoon ?? false,
        },
        importantOnly: userSettings?.featuredTasklist.importantOnly ?? false,
        maxItems: userSettings?.featuredTasklist.maxItems ?? 5,
        showCompleted: userSettings?.featuredTasklist.showCompleted ?? false,
        sortOrder: userSettings?.featuredTasklist.sortOrder ?? "due_date",
        view: userSettings?.featuredTasklist.view ?? "compact",
        showProgress: userSettings?.featuredTasklist.showProgress ?? false,
        showQuickAdd: userSettings?.featuredTasklist.showQuickAdd ?? false,
    }), [userSettings]);

    const defaultValues: FeaturedTasklistSettings = {
        tasklistId: userSettings?.featuredTasklist.tasklistId,
        justMeFilter: false,
        urgencyFilter: {
            overdue: false,
            dueToday: false,
            dueSoon: false
        },
        importantOnly: false,
        maxItems: -1,
        showCompleted: false,
        sortOrder: "due_date",
        view: "compact",
        showProgress: false,
        showQuickAdd: false,
    }

    const handleTabChange = (newValue: string | null) => {
        if (form.isDirty()) {
            setPendingTab(newValue);
            setShowDiscardWarning(true);
        } else {
            setActiveTab(newValue);
        }
    }

    const onConfirmDiscard = () => {
        // Reset the form (this discards the changes)
        form.reset();

        // Hide the warning
        setShowDiscardWarning(false);

        if (pendingTab) {
            // If we were trying to switch tabs, do it now
            setActiveTab(pendingTab);
            setPendingTab(null);
        } else {
            // Otherwise, we were trying to close the modal
            // (Use the hook's handler which calls onClose)
            handleDiscardConfirmation();
        }
    };

    useEffect(() => {
        if (opened) {
            form.setValues(initialValues);
            form.resetDirty();
        }
    }, [opened]);

    const {
        form,
        showDiscardWarning,
        showDeleteConfirmation,
        handleResetToDefaults,
        isSubmitting,
        handleSubmit,
        handleClose,
        setShowDiscardWarning,
        handleDiscardConfirmation
    } = useSettingsModal({
        entityId: user?.id,
        initialValues,
        defaultValues,
        onSubmit: async (values) => {
            await updateUserSettings(values).unwrap();
        },
        onClose: () => setShowFeaturedListSettings(false),
    });

    return (
        <Modal
            key={`${user?.id}-${user?.tasklistId}`}
            opened={opened}
            onClose={handleClose}
            title="Featured List Settings"
            size="xl"
            radius="md"
            fullScreen={isSmallScreen}
            styles={{
                body: { display: "flex", flexDirection: "column", height: "100%", padding: 0, overflow: 'hidden' },
                content: { overflow: 'hidden', maxHeight: isSmallScreen ? "100%" : "700px", height: "100%", display: "flex", flexDirection: "column" }
            }}
            closeOnEscape={(!showDiscardWarning && !showDeleteConfirmation)}
        >
            <Tabs onChange={handleTabChange} value={activeTab} defaultValue="tasks" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
                <Tabs.List className="tasklist-settings-tablist" style={{ flexShrink: 0, padding: "0 16px", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div style={{ display: "flex" }}>
                        <Tabs.Tab className="tasklist-settings-tab" color="cyan.6" value="tasks">Tasklist</Tabs.Tab>
                        <Tabs.Tab className="tasklist-settings-tab" color="cyan.6" value="shopping">Shopping List</Tabs.Tab>
                    </div>
                </Tabs.List>
                <FeaturedTasklistTab form={form} handleClose={handleClose} />
            </Tabs>
            <Modal.Header component={'footer'} pos={'sticky'} bottom={0} style={{ borderRadius: 0, borderTop: "1px solid var(--mantine-color-gray-3)" }}>
                <Group justify="space-between" w="100%">
                    <Button size="compact-sm" variant="transparent" color="var(--tasklist-color)" onClick={handleResetToDefaults} fw={500}>Reset to default</Button>
                    <Group gap="0.5rem">
                        <Button
                            color="var(--tasklist-color)"
                            variant="outline"
                            className="tasklist-settings-footer-btn"
                            onClick={() => form.reset()}
                            disabled={!form.isDirty() || !form.isValid()}
                            fw={500}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="var(--tasklist-color)"
                            variant="filled"
                            className="tasklist-settings-footer-btn"
                            disabled={!form.isDirty() || !form.isValid()}
                            onClick={() => handleSubmit()}
                            loading={isSubmitting}
                            loaderProps={{ children: 'Saving...' }}
                            fw={500}
                        >
                            Update
                        </Button>
                    </Group>
                </Group>
            </Modal.Header>
            {
                showDiscardWarning && (
                    <DiscardWarning
                        opened={showDiscardWarning}
                        setShowDiscardWarning={setShowDiscardWarning}
                        handleClose={onConfirmDiscard}
                    />
                )
            }
        </Modal>
    )
}