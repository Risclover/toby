import { useGetShoppingListCategoriesQuery } from "@/store";

export const useShoppingListCategories = (listId: number) => {
    const { data: listCategories = [] } = useGetShoppingListCategoriesQuery(listId);
    const sorted = [...listCategories].sort((a, b) => a.name.localeCompare(b.name));
    return { categories: sorted };
};