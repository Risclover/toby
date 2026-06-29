import { Drawer, Button, Stack, Textarea, Group } from "@mantine/core";
import type { ShoppingItem, ShoppingList } from "@/store";
import type { DraftState } from "../../types/shoppingListDetailsPanel.types";
import { ShoppingListAddItemQuantity } from "../AddItemDetails/ShoppingListAddItemQuantity";
import { ShoppingListDetailCategoryInput } from "./ShoppingListDetailCategoryInput";
import { ShoppingListDetailUnitInput } from "./ShoppingListDetailUnitInput";
import { ShoppingListDetailNameInput } from "./ShoppingListDetailNameInput";
import { ShoppingListDetailField } from "./ShoppingListDetailField";
import { useShoppingListDetailsPanel } from "../../hooks/useShoppingListDetailsPanel";
import { DiscardWarning } from "@/components";

type Props = {
    item: ShoppingItem;
    list: ShoppingList;
    opened: boolean;
    close: () => void;
}

export const ShoppingListDetailsPanel = ({ item, list, opened, close }: Props) => {
    const {
        draft,
        setDraft,
        dirty,
        resolvedQuantity,
        isLoading,
        handleCancel,
        handleSave,
        showDiscardWarning,
        setShowDiscardWarning,
        handleClose,
        onConfirmDiscard
    } = useShoppingListDetailsPanel({ item, list, opened, close });

    return (
        <>
            <Drawer
                position="bottom"
                radius="md"
                opened={opened}
                onClose={handleClose}
                title="Item Details"
                size={620}
                styles={{ body: { height: "calc(100% - 60px)" } }}
            >
                <Stack justify="space-between" h="100%">
                    <Stack gap="lg">
                        <ShoppingListDetailField label="Name">
                            <ShoppingListDetailNameInput
                                name={draft.name}
                                onCommit={(name) => setDraft((prev: DraftState) => ({ ...prev, name }))}
                            />
                        </ShoppingListDetailField>
                        <ShoppingListDetailField label="Quantity">
                            <ShoppingListAddItemQuantity
                                quantity={resolvedQuantity}
                                onCommit={(quantity) => setDraft((prev: DraftState) => ({ ...prev, quantity }))}
                                onClose={(val) => setDraft((prev: DraftState) => ({ ...prev, quantity: val ?? "" }))}
                            />
                        </ShoppingListDetailField>
                        <ShoppingListDetailField label="Unit">
                            <ShoppingListDetailUnitInput
                                unit={draft.unit}
                                quantity={resolvedQuantity}
                                onCommit={(unit) => setDraft((prev: DraftState) => ({ ...prev, unit }))}
                            />
                        </ShoppingListDetailField>
                        <ShoppingListDetailField label="Category">
                            <ShoppingListDetailCategoryInput
                                list={list}
                                categoryId={draft.categoryId}
                                onCommit={(categoryId) => setDraft((prev: DraftState) => ({ ...prev, categoryId }))}
                            />
                        </ShoppingListDetailField>
                        <ShoppingListDetailField label="Notes">
                            <Textarea
                                value={draft.notes}
                                onChange={(e) => {
                                    const notes = e.currentTarget.value;
                                    setDraft((prev: DraftState) => ({ ...prev, notes }));
                                }}
                                placeholder="Add a note"
                                autosize
                                minRows={2}
                                maxRows={5}
                                maxLength={150}
                            />
                        </ShoppingListDetailField>
                    </Stack>
                    <Group mt="sm" grow gap="xs">
                        <Button
                            type="button"
                            variant="outline"
                            color={list.color}
                            disabled={!dirty}
                            onClick={handleCancel}
                            size="sm"
                            fw={500}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            color={list.color}
                            loading={isLoading}
                            onClick={handleSave}
                            disabled={!dirty || draft.name.trim().length === 0}
                            size="sm"
                            fw={500}
                        >
                            Save
                        </Button>
                    </Group>
                </Stack>
            </Drawer>
            <DiscardWarning
                opened={showDiscardWarning}
                setShowDiscardWarning={setShowDiscardWarning}
                handleClose={onConfirmDiscard}
                shoppingList={list}
            />
        </>
    );
};