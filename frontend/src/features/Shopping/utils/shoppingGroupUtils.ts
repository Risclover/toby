import type { ShoppingItem, ShoppingList } from "@/store";
import type { CategoryGroup } from "../hooks/useShoppingListGroups";

// Empty stand-in list so useShoppingListGroups (which requires a real ShoppingList,
// not undefined) can always be called unconditionally, satisfying hooks rules,
// while the featured list is still loading or unset.
export const EMPTY_LIST: ShoppingList = {
    id: 0,
    title: "",
    householdId: 0,
    creatorId: 0,
    color: "",
    allMembers: false,
    isArchived: false,
    archivedBy: null,
    archivedDate: null,
    categories: [],
    items: [],
    memberIds: [],
    defaultSort: "created",
    groupByCategory: false,
    createdAt: "",
    updatedAt: "",
};

// maxItems caps unchecked items only, applied globally across the whole
// display — not per category. Category order follows useShoppingListGroups'
// own alphabetical sort, with uncategorized items filling any remaining
// budget last, same relative position as in that hook's return shape.
export const truncateGroups = (
    categoryGroups: CategoryGroup[],
    uncategorized: ShoppingItem[],
    maxItems: number
): { categoryGroups: CategoryGroup[]; uncategorized: ShoppingItem[] } => {
    if (maxItems <= 0) return { categoryGroups, uncategorized };

    let remaining = maxItems;
    const cappedGroups: CategoryGroup[] = [];

    for (const group of categoryGroups) {
        if (remaining <= 0) break;
        const items = group.items.slice(0, remaining);
        if (items.length > 0) {
            cappedGroups.push({ category: group.category, items });
            remaining -= items.length;
        }
    }

    const cappedUncategorized = remaining > 0 ? uncategorized.slice(0, remaining) : [];

    return { categoryGroups: cappedGroups, uncategorized: cappedUncategorized };
};