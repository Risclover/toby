import { useMemo, useState } from "react";
import type { UseFormReturnType } from "@mantine/form";

import type { NoteFormValues } from "@/features";
import { useIsSmallScreen } from "@/hooks";
import { useGetCategoriesQuery, type PersonalNoteCategory } from "@/store";
import { getContrastTextColor } from "@/utils";

import { FaFolderClosed } from "react-icons/fa6";

type UseCategoryPickerProps = {
    /** The currently selected category, or null if uncategorized. */
    selectedCategory: PersonalNoteCategory | null;
    /** Called when a category is selected or deselected. */
    onSelectCategory: (category: PersonalNoteCategory | null) => void;
    /** The note form instance. */
    form: UseFormReturnType<NoteFormValues, (values: NoteFormValues) => NoteFormValues>;
}

/**
 * Manages all state and handlers for the CategoryPicker component.
 *
 * Owns drawer, modal, and manage-categories visibility, and notifies
 * the parent modal when any sub-modal is open.
 */
export const useCategoryPicker = ({
    selectedCategory,
    onSelectCategory,
    form,
}: UseCategoryPickerProps) => {
    const isSmallScreen = useIsSmallScreen(425);

    const [showDrawer, setShowDrawer] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showManageCategories, setShowManageCategories] = useState(false);

    const { data: categories } = useGetCategoriesQuery();

    const handleCategoryClick = (category: PersonalNoteCategory) => {
        const isDeselecting = selectedCategory?.id === category.id;
        onSelectCategory(isDeselecting ? null : category);
        form.setFieldValue("categoryId", isDeselecting ? undefined : category.id);
    };

    const handleDrawerCategoryClick = (category: PersonalNoteCategory) => {
        handleCategoryClick(category);
        setShowDrawer(false);
    };

    const handleAddCategory = () => {
        setShowDrawer(false);
        setShowCreateModal(true);
    };

    const handleManageOpen = () => {
        setShowDrawer(false);
        setShowManageCategories(true);
    };

    const buttonContent = (
        <>
            {!selectedCategory && <FaFolderClosed size=".825rem" color="var(--mantine-color-gray-7)" />}
            {selectedCategory ? selectedCategory.name : "Uncategorized"}
        </>
    );

    const buttonProps = useMemo(() => ({
        size: "xs" as const,
        fw: 500,
        variant: "light" as const,
        className: "personal-note-form-category",
        color: selectedCategory?.color || "var(--mantine-color-gray-7)",
        styles: {
            label: {
                color: selectedCategory ? getContrastTextColor(selectedCategory.color) : undefined,
            }
        },
        style: {
            borderTopRightRadius: selectedCategory ? 0 : undefined,
            borderBottomRightRadius: selectedCategory ? 0 : undefined,
        },
    }), [selectedCategory]);

    return {
        isSmallScreen,
        showDrawer,
        setShowDrawer,
        showCreateModal,
        setShowCreateModal,
        showManageCategories,
        setShowManageCategories,
        categories,
        handleCategoryClick,
        handleDrawerCategoryClick,
        handleAddCategory,
        handleManageOpen,
        buttonContent,
        buttonProps,
    };
};