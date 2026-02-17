import { useIsSmallScreen } from "@/hooks";
import { useSettingsModal } from "@/hooks/useSettingsModal";
import { useAuthenticateQuery, useGetHouseholdTasklistsQuery } from "@/store";
import { useGetUserSettingsQuery, useUpdateUserSettingsMutation, type FeaturedTasklistSettings } from "@/store/userSettingSlice";
import { Button, Group, Modal, Tabs } from "@mantine/core"
import { useForm } from "@mantine/form";
import { FeaturedTasklistTab } from "./FeaturedTasklistTab";
import { DiscardWarning } from "@/features";
import { useEffect, useMemo } from "react";

type Props = {
    opened: boolean;
    handleClose: () => void;
}
export const FeaturedListSettings = ({ opened, handleClose }: Props) => {
    const isSmallScreen = useIsSmallScreen();
    const { data: user } = useAuthenticateQuery();
    const [updateUserSettings] = useUpdateUserSettingsMutation();
    const { data: userSettings } = useGetUserSettingsQuery();
    const { data: tasklists } = useGetHouseholdTasklistsQuery(user?.householdId);

    console.log('HI', tasklists?.filter(tasklist => tasklist.id === user.featuredTasklistId));
    // 1. Define strictly typed values
    const initialValues = useMemo<FeaturedTasklistSettings>(() => ({
        featuredTasklist: user.featuredTasklistId?.toString() ?? "",
        rotation: userSettings?.featuredTasklist.rotation ?? "auto_rotate",
        assigneeFilter: userSettings?.featuredTasklist.assigneeFilter ?? "all_tasks",
        urgencyFilter: userSettings?.featuredTasklist.urgencyFilter ?? "all",
        importantOnly: userSettings?.featuredTasklist.importantOnly ?? false,
        maxItems: userSettings?.featuredTasklist.maxItems ?? 5,
        showCompleted: userSettings?.featuredTasklist.showCompleted ?? false,
        sortOrder: userSettings?.featuredTasklist.sortOrder ?? "due_date",
        view: userSettings?.featuredTasklist.view ?? "compact",
        showProgress: userSettings?.featuredTasklist.showProgress ?? false,
        showQuickAdd: userSettings?.featuredTasklist.showQuickAdd ?? false
    }), [user.featuredTasklistId, userSettings]);

    useEffect(() => {
        // Determine the new value (string or empty string)
        const newFeaturedId = user?.featuredTasklistId?.toString() ?? "";

        // Update the form field directly
        form.setFieldValue('featuredTasklist', newFeaturedId);

        // Optional: Reset dirty state if you want the "Update" button to disable
        // form.resetDirty(); 
    }, [user?.featuredTasklistId]); // <--- RUNS WHENEVER THE ID CHANGES

    // 3. Keep your "Reset on Open" logic if you want
    useEffect(() => {
        if (opened) {
            form.setValues(initialValues);
            form.resetDirty();
        }
    }, [opened]);

    // 2. DELETE the manual useForm call.
    // const form = useForm(...)  <-- REMOVE THIS

    // 3. Destructure the form from your custom hook instead
    const {
        form, // <-- Get form here
        showDiscardWarning,
        showDeleteConfirmation,
        handleResetToDefaults,
        isSubmitting,
        handleSubmit,
        setShowDiscardWarning,
        handleDiscardConfirmation
    } = useSettingsModal({
        entityId: user?.id,
        initialValues, // Now works without casting
        defaultValues: {},
        onSubmit: async (values) => {
            await updateUserSettings(values).unwrap();
        },
        onClose: () => handleClose(),
    });

    console.log('DEBUG: FeaturedListSettings Rendered');
    console.log('DEBUG: User ID from Query:', user?.id);
    console.log('DEBUG: Featured List ID from Query:', user?.featuredTasklistId);
    console.log('DEBUG: Form Values:', form.values.featuredTasklist);

    return (
        <Modal
            key={`${user?.id}-${user?.featuredTasklistId}`}
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
            <Tabs defaultValue="tasks" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
                <Tabs.List className="tasklist-settings-tablist" style={{ flexShrink: 0, padding: "0 16px", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div style={{ display: "flex" }}>
                        <Tabs.Tab className="tasklist-settings-tab" color="cyan.6" value="tasks">Tasklist</Tabs.Tab>
                        <Tabs.Tab className="tasklist-settings-tab" color="cyan.6" value="shopping">Shopping List</Tabs.Tab>
                    </div>
                </Tabs.List>
                <FeaturedTasklistTab form={form} />
            </Tabs>
            <Modal.Header component={'footer'} pos={'sticky'} bottom={0} style={{ borderRadius: 0, borderTop: "1px solid var(--mantine-color-gray-3)" }}>
                <Group justify="space-between" w="100%">
                    <Button size="compact-sm" variant="transparent" color="var(--tasklist-color)" onClick={handleResetToDefaults}>Reset to default</Button>
                    <Group gap="0.5rem">
                        <Button
                            color="var(--tasklist-color)"
                            variant="outline"
                            className="tasklist-settings-footer-btn"
                            onClick={() => form.reset()}
                            disabled={!form.isDirty() || !form.isValid()}
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
    )
}