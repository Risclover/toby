import { Drawer, Button, Stack, Textarea } from "@mantine/core";
import { useEffect, useState } from "react";
import { ShoppingListAddItemQuantity } from "../AddItemDetails/ShoppingListAddItemQuantity";
import type { ShoppingItem, ShoppingList } from "@/store";
import { useEditShoppingItemMutation } from "@/store";
import { KittyNotification } from "@/components";
import { KittyIcons } from "@/assets";
import { ShoppingListDetailCategoryInput } from "./ShoppingListDetailCategoryInput";
import { ShoppingListDetailUnitInput } from "./ShoppingListDetailUnitInput";
import { ShoppingListDetailNameInput } from "./ShoppingListDetailNameInput";

type Props = {
    item: ShoppingItem;
    list: ShoppingList;
    opened: boolean;
    close: () => void;
}

export const ShoppingListDetailsPanel = ({ item, list, opened, close }: Props) => {
    const [draftName, setDraftName] = useState(item.name);
    const [draftQuantity, setDraftQuantity] = useState(item.quantity ?? 0);
    const [draftUnit, setDraftUnit] = useState(item.unit ?? "");
    const [draftCategoryId, setDraftCategoryId] = useState<number | null>(item.categoryId ?? null);
    const [draftNotes, setDraftNotes] = useState(item.notes ?? "");

    const [updateItem, { isLoading }] = useEditShoppingItemMutation();

    useEffect(() => {
        if (opened) {
            setDraftName(item.name);
            setDraftQuantity(item.quantity ?? 0);
            setDraftUnit(item.unit ?? "");
            setDraftCategoryId(item.categoryId ?? null);
            setDraftNotes(item.notes ?? "");
        }
    }, [opened]);

    const handleSave = async () => {
        try {
            await updateItem({
                itemId: item.id,
                listId: list.id,
                name: draftName.trim(),
                quantity: draftQuantity > 0 ? draftQuantity : null,
                unit: draftUnit.length > 0 ? draftUnit : null,
                categoryId: draftCategoryId,
                notes: draftNotes.trim().length > 0 ? draftNotes.trim() : null,
            }).unwrap();
            close();
            KittyNotification({
                title: "Item updated",
                message: <>Changes to "<strong style={{ fontWeight: 500 }}>{item.name}</strong>" were saved.</>,
                icon: KittyIcons.Celebrate,
                color: "green",
            });
        } catch {
            KittyNotification({
                title: "Couldn't save changes",
                message: <>Toby fumbled and failed to update "<strong style={{ fontWeight: 500 }}>{item.name}</strong>". Try again.</>,
                icon: KittyIcons.Cry,
                color: "red",
            });
        }
    };

    return (
        <Drawer
            position="bottom"
            radius="md"
            opened={opened}
            onClose={close}
            title="Item Details"
            size={620}
            styles={{
                body: {
                    height: "calc(100% - 60px)"
                }
            }}
        >
            <Stack justify="space-between" h="100%">
                <Stack gap="lg">
                    <div className="details-panel-section">
                        <div className="task-details-label">Name</div>
                        <ShoppingListDetailNameInput
                            name={draftName}
                            onCommit={setDraftName}
                        />
                    </div>
                    <div className="details-panel-section">
                        <div className="task-details-label">Quantity</div>
                        <ShoppingListAddItemQuantity
                            quantity={draftQuantity}
                            onCommit={setDraftQuantity}
                            onClose={(val) => setDraftQuantity(val ?? 0)}
                        />
                    </div>
                    <div className="details-panel-section">
                        <div className="task-details-label">Unit</div>
                        <ShoppingListDetailUnitInput
                            unit={draftUnit}
                            quantity={draftQuantity}
                            onCommit={setDraftUnit}
                        />
                    </div>
                    <div className="details-panel-section">
                        <div className="task-details-label">Category</div>
                        <ShoppingListDetailCategoryInput
                            list={list}
                            categoryId={draftCategoryId}
                            onCommit={setDraftCategoryId}
                        />
                    </div>
                    <div className="details-panel-section">
                        <div className="task-details-label">Notes</div>
                        <Textarea
                            value={draftNotes}
                            onChange={(e) => setDraftNotes(e.currentTarget.value)}
                            placeholder="Add a note"
                            autosize
                            minRows={2}
                            maxRows={5}
                            maxLength={150}
                        />
                    </div>

                </Stack>
                <Button
                    mt="sm"
                    color="rgb(5, 5, 73)"
                    loading={isLoading}
                    onClick={handleSave}
                    disabled={draftName.trim().length === 0}
                    size="md"
                    fw={500}
                >
                    Save
                </Button>
            </Stack>
        </Drawer>
    );
};