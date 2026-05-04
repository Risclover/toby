import { useState } from "react";

import { KittyNotification } from "@/components";
import { useNotesFilterContext } from "@/contexts";
import { useDeleteNoteCategoryMutation, type PersonalNoteCategory } from "@/store";

import { KittyIcons } from "@/assets";

type UseCategoryMenuProps = {
    /** Targeted category */
    category: PersonalNoteCategory
}

/**
 * Custom hook that provides functionality for note category menu
 */
export const useCategoryMenu = ({ category }: UseCategoryMenuProps) => {
    const { filters, updateFilters } = useNotesFilterContext();
    const [deleteCategory] = useDeleteNoteCategoryMutation();
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const handleDeleteCategory = async () => {
        try {
            await deleteCategory(category.id).unwrap();
            updateFilters({
                categoryIds: filters.categoryIds.filter(id => id !== category.id)
            });

            KittyNotification({
                title: "Category deleted",
                message: (
                    <>
                        Category "
                        <strong style={{ fontWeight: 500 }}>
                            {category.name}
                        </strong>
                        " successfully deleted.
                    </>
                ),
                icon: KittyIcons.Hero,
                color: "green"
            })

            setShowConfirmDelete(false);
        } catch (error) {
            setShowConfirmDelete(false);
            KittyNotification({
                title: "Ugh, that didn't work!",
                message: <>Something went wrong. Try again.</>,
                icon: KittyIcons.Rain,
                color: "red"
            })
            console.error("Failed to delete category:", error);
        }
    }

    return {
        handleDeleteCategory,
        showConfirmDelete,
        setShowConfirmDelete
    }
}