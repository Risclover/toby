import type React from "react";
import { useCombobox } from "@mantine/core"
import { useShoppingListCategories } from "./useShoppingListCategories";
import type { ShoppingList } from "@/store";

type Props = {
    /** List in question */
    list: ShoppingList;
    /** Id of category added */
    categoryId: number | null;
    /** onCommit handler */
    onCommit: (id: number | null) => void;
    /** Close handler */
    onClose: (finalValue?: number | null) => void;
}

/** Custom hook of handlers and logic for ShoppingListAddItemCategory component */
export const useShoppingListAddItemCategory = ({ list, categoryId, onCommit, onClose }: Props) => {
    const categoryCombobox = useCombobox({
        onDropdownClose: () => categoryCombobox.resetSelectedOption()
    });

    const { categories } = useShoppingListCategories(list.id);
    const selectedCategory = categories.find((c) => c.id === categoryId);

    const handleSubmitCombobox = (val: string) => {
        const selectedId = Number(val);
        const newId = selectedId === categoryId ? null : selectedId;
        onCommit(newId);
        onClose(newId);
        categoryCombobox.closeDropdown();
    }

    const handleClickClose = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onCommit(null);
        onClose(null);
        categoryCombobox.closeDropdown();
    }

    return {
        categoryCombobox,
        categories,
        handleSubmitCombobox,
        handleClickClose,
        selectedCategory,
    }
}