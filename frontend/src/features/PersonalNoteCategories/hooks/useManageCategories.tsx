import { useState } from "react";
import { useModalsStack } from "@mantine/core";

import { useGetCategoriesQuery, type PersonalNoteCategory } from "@/store";

/** Maximum number of note categories a user can create. */
export const MAX_CATEGORIES = 10;

type UseManageCategoriesProps = {
    /** Modal visibility */
    opened: boolean;
    /** Closes the manage categories modal */
    setShowManageCategories: (val: boolean) => void;
}

/**
 * Manages state and handlers for the ManageCategories modal.
 *
 * Owns the modal stack, editing state, and all open/close logic.
 */
export const useManageCategories = ({ setShowManageCategories }: UseManageCategoriesProps) => {
    const stack = useModalsStack(['manage', 'edit']);
    const { data: categories } = useGetCategoriesQuery();
    const [editingCategory, setEditingCategory] = useState<PersonalNoteCategory | null>(null);

    const handleEditClick = (category: PersonalNoteCategory) => {
        setEditingCategory(category);
        stack.open('edit');
    };

    const handleClose = () => {
        setShowManageCategories(false);
    };

    const handleCreateCategoryClose = () => {
        setEditingCategory(null);
        stack.close('edit');
    };

    return {
        stack,
        categories,
        editingCategory,
        handleEditClick,
        handleClose,
        handleCreateCategoryClose
    };
};