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

type Options = {
    groupByCategory: boolean;
    sort: "created" | "alpha";
};

const sortItems = (items: ShoppingItem[], sort: "created" | "alpha") => {
    if (sort === "alpha") {
        return [...items].sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sort === "created") {
        return [...items].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return items;
};

export const useShoppingListGroups = (list: ShoppingList, options: Options): ShoppingListGroups => {
    const unchecked = list.items.filter((item) => !item.isChecked);
    const checked = list.items.filter((item) => item.isChecked);

    if (!options.groupByCategory) {
        return {
            categoryGroups: [],
            uncategorized: sortItems(unchecked, options.sort),
            checked,
        };
    }

    const categoryGroups = list.categories
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((category) => ({
            category,
            items: sortItems(
                unchecked.filter((item) => item.categoryId === category.id),
                options.sort
            ),
        }))
        .filter((group) => group.items.length > 0);

    const categorizedIds = new Set(categoryGroups.flatMap((g) => g.items.map((i) => i.id)));
    const uncategorized = sortItems(
        unchecked.filter((item) => !categorizedIds.has(item.id)),
        options.sort
    );

    return { categoryGroups, uncategorized, checked };
};