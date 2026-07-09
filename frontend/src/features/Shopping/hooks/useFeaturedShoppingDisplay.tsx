import type { ShoppingList } from "@/store";
import type { FeaturedShoppingListSettings } from "@/store/featuredShoppingListSettingSlice";
import { useFeaturedShoppingItems } from "./useFeaturedShoppingItems";
import { useShoppingListGroups } from "./useShoppingListGroups";
import { truncateGroups, EMPTY_LIST } from "../utils/shoppingGroupUtils";

// Everything the homepage shopping card needs to decide WHAT to render —
// filtering, grouping, truncation, and the empty/victory state checks — in
// one place, separate from how it's actually rendered.
export const useFeaturedShoppingDisplay = (
    list: ShoppingList | undefined,
    settings: FeaturedShoppingListSettings | undefined
) => {
    const items = list?.items ?? [];
    const uncheckedCount = items.filter(i => !i.isChecked).length;
    const totalCount = items.length;

    const showCompleted = settings?.showCompleted ?? false;
    const categoryGroupsEnabled = settings?.categoryGroups ?? false;
    const sortOrder = settings?.sortOrder ?? "created";
    const maxItems = settings?.maxItems ?? 5;

    // Flat mode — used when categoryGroups is off.
    const displayedItems = useFeaturedShoppingItems(items, settings);

    // Grouped mode — always called (hooks can't be conditional), result only
    // used when categoryGroupsEnabled is true.
    const groups = useShoppingListGroups(list ?? EMPTY_LIST, {
        groupByCategory: true,
        sort: sortOrder,
    });
    const truncated = truncateGroups(groups.categoryGroups, groups.uncategorized, maxItems);
    const visibleCheckedItems = showCompleted ? groups.checked : [];

    // True only when CHECKING an item will make it leave the array it's
    // currently rendered from (grouped mode always relocates it; flat mode
    // only does this when completed items are hidden).
    const fadesOutOnCheck = categoryGroupsEnabled ? true : !showCompleted;

    const hasItems = items.length > 0;
    const allChecked = hasItems && items.filter(i => !i.isChecked).length === 0;
    const isVictoryState = allChecked && !showCompleted;

    const isEmptyState = categoryGroupsEnabled
        ? truncated.categoryGroups.every(g => g.items.length === 0)
        && truncated.uncategorized.length === 0
        && visibleCheckedItems.length === 0
        : displayedItems.length === 0;

    const percent = totalCount === 0 ? 0 : Math.round(((totalCount - uncheckedCount) / totalCount) * 100);

    return {
        uncheckedCount,
        totalCount,
        percent,
        categoryGroupsEnabled,
        displayedItems,
        truncated,
        visibleCheckedItems,
        fadesOutOnCheck,
        isVictoryState,
        isEmptyState,
    };
};