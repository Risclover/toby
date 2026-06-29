import { useEffect, useState } from "react";
import type { ShoppingItem, ShoppingList } from "@/store";
import { useEditShoppingItemMutation } from "@/store";
import { KittyNotification } from "@/components";
import { KittyIcons } from "@/assets";
import { buildDraft, isDirty, type DraftState } from "../types/shoppingListDetailsPanel.types";

type UseShoppingListDetailsPanelProps = {
    item: ShoppingItem;
    list: ShoppingList;
    opened: boolean;
    close: () => void;
}

export const useShoppingListDetailsPanel = ({ item, list, opened, close }: UseShoppingListDetailsPanelProps) => {
    const [draft, setDraft] = useState<DraftState>(() => buildDraft(item));
    const [original, setOriginal] = useState<DraftState>(() => buildDraft(item));
    const [updateItem, { isLoading }] = useEditShoppingItemMutation();

    useEffect(() => {
        if (opened) {
            const fresh = buildDraft(item);
            setDraft(fresh);
            setOriginal(fresh);
        }
    }, [opened]);

    const dirty = isDirty(draft, original);
    const resolvedQuantity = draft.quantity === "" ? 0 : draft.quantity;

    const handleCancel = () => setDraft(original);

    const handleSave = async () => {
        try {
            await updateItem({
                itemId: item.id,
                listId: list.id,
                name: draft.name.trim(),
                quantity: draft.quantity !== "" && draft.quantity > 0 ? draft.quantity : null,
                unit: draft.unit.length > 0 ? draft.unit : null,
                categoryId: draft.categoryId,
                notes: draft.notes.trim().length > 0 ? draft.notes.trim() : null,
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

    return {
        draft,
        setDraft,
        dirty,
        resolvedQuantity,
        isLoading,
        handleCancel,
        handleSave,
    };
};