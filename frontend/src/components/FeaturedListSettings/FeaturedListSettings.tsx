import { useIsSmallScreen } from "@/hooks";
import { useSettingsModal } from "@/hooks/useSettingsModal";
import { useAuthenticateQuery, useGetFeaturedListSettingsQuery, useGetShoppingListsQuery, useUpdateFeaturedListSettingsMutation, type FeaturedTasklistSettings } from "@/store";
import { Button, Group, Modal, Tabs } from "@mantine/core"
import { FeaturedTasklistTab } from "./FeaturedTasklistTab";
import { DiscardWarning } from "@/features";
import { useEffect, useMemo, useState } from "react";
import { FeaturedShoppingListTab } from "./FeaturedShoppingListTab";
import { type FeaturedShoppingListSettings, useGetFeaturedShoppingListSettingsQuery, useUpdateFeaturedShoppingListSettingsMutation } from "@/store/featuredShoppingListSettingSlice";

type Props = {
    opened: boolean;
    setShowFeaturedListSettings: (val: boolean) => void;
    activeTab: string | null;
    setActiveTab: (val: string | null) => void;
}

export const FeaturedListSettings = ({ opened, setShowFeaturedListSettings, activeTab, setActiveTab }: Props) => {
    const isSmallScreen = useIsSmallScreen();
    const { data: user } = useAuthenticateQuery();

    const [updateUserSettings] = useUpdateFeaturedListSettingsMutation();
    const { data: userSettings } = useGetFeaturedListSettingsQuery();

    const [updateShoppingSettings] = useUpdateFeaturedShoppingListSettingsMutation();
    const { data: shoppingSettings } = useGetFeaturedShoppingListSettingsQuery();

    const { data: lists, isLoading: isLoadingShoppingLists } = useGetShoppingListsQuery(
        { householdId: Number(user?.householdId), isArchived: false },
        { skip: !user?.householdId }
    );
    const { data: settings } = useGetFeaturedShoppingListSettingsQuery();

    const featuredList = lists?.find(list => list.id === settings?.featuredList.listId);

    // Tracks "we're mid-close/mid-switch and something is unsaved."
    // pendingTab distinguishes WHY the warning is showing:
    //   - pendingTab set    -> user tried to switch tabs while the current
    //                          tab's form was dirty; confirming resets ONLY
    //                          that tab's form, then completes the switch.
    //   - pendingTab null   -> user tried to close the modal while either
    //                          form was dirty; confirming resets BOTH forms.
    const [showDiscardWarning, setShowDiscardWarningRaw] = useState(false);
    const [pendingTab, setPendingTab] = useState<string | null>(null);

    // Whenever the warning is dismissed WITHOUT confirming (user backs out),
    // clear pendingTab too, so a cancelled tab-switch warning can't leak into
    // a later modal-close and cause the wrong reset scope.
    const setShowDiscardWarning = (val: boolean) => {
        if (!val) setPendingTab(null);
        setShowDiscardWarningRaw(val);
    };

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

    const initialShoppingValues = useMemo<FeaturedShoppingListSettings>(() => ({
        listId: shoppingSettings?.featuredList.listId ?? null,
        maxItems: shoppingSettings?.featuredList.maxItems ?? 5,
        showCompleted: shoppingSettings?.featuredList.showCompleted ?? false,
        sortOrder: shoppingSettings?.featuredList.sortOrder ?? "created",
        showProgress: shoppingSettings?.featuredList.showProgress ?? false,
        showQuickAdd: shoppingSettings?.featuredList.showQuickAdd ?? false,
        categoryGroups: shoppingSettings?.featuredList.categoryGroups ?? false,
        view: shoppingSettings?.featuredList.view ?? "compact"
    }), [shoppingSettings])

    const defaultShoppingValues: FeaturedShoppingListSettings = {
        listId: shoppingSettings?.featuredList.listId,
        maxItems: -1,
        showCompleted: false,
        categoryGroups: false,
        sortOrder: "created",
        showProgress: false,
        showQuickAdd: false,
        view: "compact"
    }

    // Each tab keeps its own form + submit/reset handling via useSettingsModal.
    // We ignore the discard-warning/close plumbing each instance returns
    // (showDiscardWarning, handleClose, handleDiscardConfirmation, etc.) —
    // that's handled once, centrally, below, since closing the MODAL (as
    // opposed to submitting a single tab's form) needs to know about both.
    const {
        form,
        handleResetToDefaults,
        isSubmitting,
        handleSubmit,
    } = useSettingsModal({
        entityId: user?.id,
        initialValues,
        defaultValues,
        onSubmit: async (values) => {
            await updateUserSettings(values).unwrap();
        },
        onClose: () => setShowFeaturedListSettings(false),
    });

    const {
        form: shoppingForm,
        handleResetToDefaults: handleShoppingResetToDefault,
        isSubmitting: isShoppingSubmitting,
        handleSubmit: handleShoppingSubmit,
    } = useSettingsModal({
        entityId: user?.id,
        initialValues: initialShoppingValues,
        defaultValues: defaultShoppingValues,
        onSubmit: async (values) => {
            await updateShoppingSettings(values).unwrap();
        },
        onClose: () => setShowFeaturedListSettings(false)
    })

    // Re-seed both forms whenever the modal opens — not just the tasklist one.
    // Without this, if the shopping-settings query resolved after mount but
    // before the modal was first opened, the shopping tab would show stale
    // defaults instead of the real saved settings.
    useEffect(() => {
        if (opened) {
            form.setValues(initialValues);
            form.resetDirty();
            shoppingForm.setValues(initialShoppingValues);
            shoppingForm.resetDirty();
        }
    }, [opened]);

    // Switching tabs now requires the tab being LEFT to be clean. If it's
    // dirty, block the switch and warn — confirming discards only that tab's
    // changes, not the destination tab's.
    const handleTabChange = (newValue: string | null) => {
        const leavingForm = activeTab === "shopping" ? shoppingForm : form;
        if (leavingForm.isDirty()) {
            setPendingTab(newValue);
            setShowDiscardWarning(true);
        } else {
            setActiveTab(newValue);
        }
    };

    const handleModalClose = () => {
        if (form.isDirty() || shoppingForm.isDirty()) {
            setShowDiscardWarning(true);
        } else {
            setShowFeaturedListSettings(false);
        }
    };

    const onConfirmDiscard = () => {
        if (pendingTab) {
            // Tab-switch discard — only the tab being left gets reset.
            const leavingForm = activeTab === "shopping" ? shoppingForm : form;
            leavingForm.reset();
            setShowDiscardWarning(false);
            setActiveTab(pendingTab);
            setPendingTab(null);
        } else {
            // Modal-close discard — reset both, since either could be dirty.
            form.reset();
            shoppingForm.reset();
            setShowDiscardWarning(false);
            setShowFeaturedListSettings(false);
        }
    };

    const isShoppingTab = activeTab === "shopping";

    return (
        <Modal
            key={user?.id}
            opened={opened}
            onClose={handleModalClose}
            title="Featured List Settings"
            size="xl"
            radius="md"
            fullScreen={isSmallScreen}
            styles={{
                body: { display: "flex", flexDirection: "column", height: "100%", padding: 0, overflow: 'hidden' },
                content: { overflow: 'hidden', maxHeight: isSmallScreen ? "100%" : "700px", height: "100%", display: "flex", flexDirection: "column" }
            }}
            closeOnEscape={!showDiscardWarning}
        >
            <Tabs onChange={handleTabChange} value={activeTab} defaultValue="tasks" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
                <Tabs.List className="tasklist-settings-tablist" style={{ flexShrink: 0, padding: "0 16px", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div style={{ display: "flex" }}>
                        <Tabs.Tab className="tasklist-settings-tab" color="cyan.6" value="tasks">Tasklist</Tabs.Tab>
                        <Tabs.Tab className="tasklist-settings-tab" color="cyan.6" value="shopping">Shopping List</Tabs.Tab>
                    </div>
                </Tabs.List>
                <FeaturedTasklistTab form={form} handleClose={handleModalClose} />
                <FeaturedShoppingListTab form={shoppingForm} handleClose={handleModalClose} />
            </Tabs>
            <Modal.Header component={'footer'} pos={'sticky'} bottom={0} style={{ borderRadius: 0, borderTop: "1px solid var(--mantine-color-gray-3)" }}>
                {isShoppingTab ? (
                    <Group justify="space-between" w="100%">
                        <Button size="compact-sm" variant="transparent" color={featuredList?.color} onClick={handleShoppingResetToDefault} fw={500}>Reset to default</Button>
                        <Group gap="0.5rem">
                            <Button
                                color={featuredList?.color}
                                variant="outline"
                                className="tasklist-settings-footer-btn"
                                onClick={() => shoppingForm.reset()}
                                disabled={!shoppingForm.isDirty() || !shoppingForm.isValid()}
                                fw={500}
                            >
                                Cancel
                            </Button>
                            <Button
                                color={featuredList?.color}
                                variant="filled"
                                className="tasklist-settings-footer-btn"
                                disabled={!shoppingForm.isDirty() || !shoppingForm.isValid()}
                                onClick={() => handleShoppingSubmit()}
                                loading={isShoppingSubmitting}
                                loaderProps={{ children: 'Saving...' }}
                                fw={500}
                            >
                                Update
                            </Button>
                        </Group>
                    </Group>
                ) : (
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
                )}
            </Modal.Header>
            {
                showDiscardWarning && (
                    <DiscardWarning
                        opened={showDiscardWarning}
                        setShowDiscardWarning={setShowDiscardWarning}
                        handleClose={onConfirmDiscard}
                        shoppingList={activeTab === "shopping" ? featuredList : null}
                    />
                )
            }
        </Modal>
    )
}