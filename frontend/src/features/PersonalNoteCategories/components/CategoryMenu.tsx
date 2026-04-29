import { ActionIcon, Menu } from "@mantine/core"
import { IoEllipsisVerticalSharp } from "react-icons/io5";
import DeleteRounded from '@mui/icons-material/Delete';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import { useDeleteNoteCategoryMutation, type PersonalNoteCategory } from "@/store";
import { DeleteConfirmation } from "@/features/HouseholdTasklists";
import { useState } from "react";
import { KittyNotification } from "@/components/KittyNotification";
import { KittyIcons } from "@/assets";
import { useNotesFilterContext } from "@/contexts/NotesFilterContext";

export const CategoryMenu = ({ category, setShowManageCategories, onEditClick }: {
    category: PersonalNoteCategory, setShowManageCategories: (val: boolean) => void, onEditClick: (category: PersonalNoteCategory) => void;
}) => {
    const [deleteCategory] = useDeleteNoteCategoryMutation();
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const { filters, updateFilters } = useNotesFilterContext();

    const handleDeleteCategory = async () => {
        try {
            await deleteCategory(category.id).unwrap();
            updateFilters({
                categoryIds: filters.categoryIds.filter(id => id !== category.id)
            });
            KittyNotification({
                title: "Category deleted",
                message: <>Category "<strong style={{ fontWeight: 500 }}>{category.name}</strong>" successfully deleted.</>,
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
    return (
        <>
            <Menu>
                <Menu.Target>
                    <ActionIcon
                        p={0}
                        h="auto"
                        size="xs"
                        variant="transparent"
                        color="gray.6"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    >
                        <IoEllipsisVerticalSharp />
                    </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Item
                        onClick={(e) => {
                            e.stopPropagation();
                            onEditClick(category);
                        }}
                        leftSection={<BorderColorRoundedIcon fontSize="small" />}
                    >
                        Edit
                    </Menu.Item>
                    <Menu.Item
                        color="red.9"
                        leftSection={<DeleteRounded fontSize="small" />}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowConfirmDelete(true);
                        }}
                    >
                        Delete
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
            <DeleteConfirmation modalTitle="Delete note" itemName={category.name} itemType="category" opened={showConfirmDelete} handleDeleteItem={handleDeleteCategory} setShowDeleteConfirmation={setShowConfirmDelete} zIndex={99999} />
        </>
    )
}