import { DeleteConfirmation } from "@/components";
import type { ShoppingCategory } from "@/index";
import { ActionIcon, Menu } from "@mantine/core"
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';

type Props = {
    category: ShoppingCategory;
    onEdit: () => void;
    onDelete: () => void;
    showDeleteConfirmation: boolean;
    setShowDeleteConfirmation: (show: boolean) => void;
}

export const ShoppingListCategoryMenu = ({ category, onEdit, onDelete, showDeleteConfirmation, setShowDeleteConfirmation }: Props) => {

    return (
        <>
            <Menu>
                <Menu.Target>
                    <ActionIcon variant="subtle" color="var(--mantine-color-gray-6)">
                        <MoreVertRoundedIcon fontSize="small" />
                    </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Item onClick={onEdit}>Edit</Menu.Item>
                    <Menu.Item onClick={() => setShowDeleteConfirmation(true)}>Delete</Menu.Item>
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