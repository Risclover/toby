// ShoppingListSettings.tsx
import { Button, Group, Modal, Tabs } from "@mantine/core";
import { useIsSmallScreen } from "@/hooks";
import { DiscardWarning } from "@/components";
import { isTooLight } from "@/utils";
import { useShoppingListSettings, type ShoppingListFormValues } from "../../hooks/useShoppingListSettings";
import { ShoppingListSettingsGeneralTab } from "./GeneralTab";
import { ShoppingListSettingsBehaviorTab } from "./BehaviorTab";
import type { ShoppingList } from "@/store";

type Props = {
    opened: boolean;
    onClose: () => void;
    list: ShoppingList;
};

export const ShoppingListSettings = ({ opened, onClose, list }: Props) => {
    const isSmallScreen = useIsSmallScreen();

    const settings = useShoppingListSettings({ list, onClose });

    const {
        form,
        isSubmitting,
        showDiscardWarning,
        setShowDiscardWarning,
        showDeleteConfirmation,
        handleClose,
        handleDiscardConfirmation,
        handleSubmit,
        handleResetToDefaults,
        initialValues,
        committedValues
    } = settings;

    const hasColorError = isTooLight(form.values.color);
    const normalize = (values: ShoppingListFormValues) => ({
        ...values,
        memberIds: [...values.memberIds].sort(),
    });
    const isDirtyFromInitial =
        JSON.stringify(normalize(form.values)) !==
        JSON.stringify(normalize(committedValues.current));


    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title="Shopping List Settings"
            size="xl"
            radius="md"
            fullScreen={isSmallScreen}
            styles={{
                body: { display: "flex", flexDirection: "column", height: "100%", padding: 0, overflow: "hidden" },
                content: { overflow: "hidden", maxHeight: isSmallScreen ? "100%" : "700px", height: "100%", display: "flex", flexDirection: "column" },
            }}
            closeOnEscape={!showDiscardWarning && !showDeleteConfirmation}
        >
            <Tabs
                defaultValue="general"
                style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}
            >
                <Tabs.List
                    style={{ flexShrink: 0, padding: "0 16px", alignItems: "flex-end" }}
                >
                    <Tabs.Tab color={list.color} value="general">General</Tabs.Tab>
                    <Tabs.Tab color={list.color} value="behavior">Behavior</Tabs.Tab>
                </Tabs.List>
                <ShoppingListSettingsGeneralTab {...settings} />
                <ShoppingListSettingsBehaviorTab form={form} list={list} />
            </Tabs>

            <Modal.Header
                component="footer"
                pos="sticky"
                bottom={0}
                style={{ borderRadius: 0, borderTop: "1px solid var(--mantine-color-gray-3)" }}
            >
                <Group justify="space-between" w="100%">
                    <Button
                        size="compact-sm"
                        variant="transparent"
                        color={list.color}
                        onClick={handleResetToDefaults}
                        fw={500}
                    >
                        Reset to default
                    </Button>
                    <Group gap="0.5rem">
                        <Button
                            color={list.color}
                            variant="outline"
                            onClick={() => form.setValues(initialValues)}
                            disabled={!isDirtyFromInitial || hasColorError}
                            fw={500}
                        >
                            Cancel
                        </Button>
                        <Button
                            color={list.color}
                            variant="filled"
                            disabled={!isDirtyFromInitial || !form.isValid() || hasColorError}
                            onClick={handleSubmit}
                            loading={isSubmitting}
                            fw={500}
                        >
                            Update
                        </Button>
                    </Group>
                </Group>
            </Modal.Header>

            {showDiscardWarning && (
                <DiscardWarning
                    opened={showDiscardWarning}
                    setShowDiscardWarning={setShowDiscardWarning}
                    handleClose={() => {
                        setShowDiscardWarning(false);
                        handleDiscardConfirmation();
                    }}
                    shoppingList={list}
                />
            )}
        </Modal>
    );
}; 