import { useMemo } from "react";
import { type ShoppingItem } from "@/store"; // adjust import path/name to match your project
import { type FeaturedShoppingListSettings } from "@/store/featuredShoppingListSettingSlice";

export const useFeaturedShoppingItems = (
    items: ShoppingItem[] | undefined,
    settings: FeaturedShoppingListSettings | undefined
) => {
    return useMemo(() => {
        if (!items || !settings) return [];

        const { showCompleted, sortOrder, maxItems } = settings;

        const inputItems = items.slice();

        // 1. FILTERING
        let result = inputItems.filter(item => {
            if (!showCompleted && item.isChecked) return false;
            return true;
        });

        // 2. SORTING — unchecked first, checked last, then user-selected order
        result.sort((a, b) => {
            if (a.isChecked !== b.isChecked) {
                return a.isChecked ? 1 : -1;
            }

            switch (sortOrder) {
                case "alpha":
                    return a.name.localeCompare(b.name, undefined, {
                        numeric: true,
                        sensitivity: 'base'
                    });

                case "created":
                default:
                    return a.id - b.id;
            }
        });

        // 3. LIMITING — maxItems caps unchecked items only.
        // If showCompleted is true, ALL checked items are still shown regardless of the cap.
        if (maxItems > 0) {
            const unchecked = result.filter(i => !i.isChecked);
            const checked = result.filter(i => i.isChecked);
            result = [...unchecked.slice(0, maxItems), ...checked];
        }

        return result;

    }, [items, settings]);
};