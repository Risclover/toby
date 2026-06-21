import { ActionIcon, Menu } from "@mantine/core"
import { DeleteConfirmation } from "@/components";
import type { ShoppingCategory } from "@/store";
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import { FaTrash } from "react-icons/fa";
import { PencilIcon } from "@/assets/icons/PencilIcon";
type Props = {
    /** The category for which to display the menu */
    category: ShoppingCategory;
    /** Function to edit the category */
    onEdit: () => void;
    /** Function to delete the category */
    onDelete: () => void;
    /** Whether the delete confirmation modal is shown */
    showDeleteConfirmation: boolean;
    /** Function to set the visibility of the delete confirmation modal */
    setShowDeleteConfirmation: (show: boolean) => void;
}

/** Actions menu for specific shopping list category */
export const ShoppingListCategoryMenu = ({
    category,
    onEdit,
    onDelete,
    showDeleteConfirmation,
    setShowDeleteConfirmation
}: Props) => {
    return (
        <>
            <Menu>
                <Menu.Target>
                    <ActionIcon
                        variant="subtle"
                        color="var(--mantine-color-gray-6)"
                    >
                        <MoreVertRoundedIcon fontSize="small" />
                    </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Item onClick={onEdit} leftSection={<PencilIcon size="1rem" color="var(--mantine-color-gray-8)" />}>
                        Edit
                    </Menu.Item>
                    <Menu.Item color='red.9' onClick={() => setShowDeleteConfirmation(true)} leftSection={<FaTrash fontSize="1rem" />}>
                        Delete
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
            <DeleteConfirmation
                modalTitle={`Say goodbye to the category ${category.name}?`}
                itemName={category.name}
                itemType="category"
                opened={showDeleteConfirmation}
                setShowDeleteConfirmation={setShowDeleteConfirmation}
                handleDeleteItem={onDelete}
            />
        </>
    )
}