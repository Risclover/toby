import type { ShoppingCategory, ShoppingItem, ShoppingList } from "@/store";

export type CategoryGroup = {
    category: ShoppingCategory;
    items: ShoppingItem[];
};

export type ShoppingListGroups = {
    categoryGroups: CategoryGroup[];
    uncategorized: ShoppingItem[];
    checked: ShoppingItem[];
};

/** Splits unchecked items into per-category groups + a flat uncategorized remainder. */
export const useShoppingListGroups = (list: ShoppingList): ShoppingListGroups => {
    const unchecked = list.items.filter((item) => !item.isChecked);
    const checked = list.items.filter((item) => item.isChecked);

    const categoryGroups = list.categories
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((category) => ({
            category,
            items: unchecked.filter((item) => item.categoryId === category.id),
        }))
        .filter((group) => group.items.length > 0);

    const categorizedIds = new Set(categoryGroups.flatMap((g) => g.items.map((i) => i.id)));
    const uncategorized = unchecked.filter((item) => !categorizedIds.has(item.id));

    return { categoryGroups, uncategorized, checked };
};