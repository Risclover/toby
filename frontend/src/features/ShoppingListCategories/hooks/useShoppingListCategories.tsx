import { useState } from "react";
import { KittyNotification } from "@/components";
import { useIsSmallScreen } from "@/hooks";
import { useCreateShoppingCategoryMutation, useGetShoppingListCategoriesQuery, type ShoppingList } from "@/store";
import { KittyIcons } from "@/assets";

type Props = {
    /** Shopping list of which to manage categories */
    list: ShoppingList;
    MAX_CATEGORIES: number;
}

/** Custom hook to manage state and logic for ShoppingListCategories */
export const useShoppingListCategories = ({ list, MAX_CATEGORIES }: Props) => {
    const [addCategory] = useCreateShoppingCategoryMutation();
    const { data: categories } = useGetShoppingListCategoriesQuery(list.id);
    const isSmall = useIsSmallScreen(425);

    const [categoryName, setCategoryName] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    const handleAddCategory = async () => {
        if (!categories || categories.length >= MAX_CATEGORIES || categoryName.trim() === "") {
            return;
        }

        try {
            await addCategory({ listId: list.id, name: categoryName }).unwrap();
            setCategoryName("");
            KittyNotification({
                title: "Category successfully added",
                message: <>Now we're cookin'! "<strong style={{ fontWeight: 500 }}>{categoryName}</strong>" was added to the roster.</>,
                color: "green",
                icon: KittyIcons.Cook
            })
        } catch (error) {
            console.error("Error adding category:", error);
            KittyNotification({
                title: "Failed to add category",
                message: <>Whoops... someone was sleeping on the job, and the category "<strong style={{ fontWeight: 500 }}>{categoryName}</strong>" couldn't be added. Try again.</>,
                color: "red",
                icon: KittyIcons.Sleep
            })
        }
    }

    return {
        categories,
        isSmall,
        categoryName,
        setCategoryName,
        isEditing,
        setIsEditing,
        handleAddCategory,
    }
}