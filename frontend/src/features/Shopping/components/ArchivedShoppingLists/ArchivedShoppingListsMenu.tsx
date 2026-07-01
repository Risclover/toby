import { useNavigate } from "react-router-dom";
import { ActionIcon, Menu } from "@mantine/core"
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import DeleteRounded from '@mui/icons-material/Delete';

import { ViewIcon, UnarchivedIcon, MenuTrashIcon } from "@/assets";
import { DeleteConfirmation } from "@/components";
import { useState } from "react";
import { useDeleteShoppingListMutation, useUnarchiveShoppingListMutation, type ShoppingList, type TasklistType } from "@/store";
import { useHousehold } from "@/hooks/useHousehold";

type Props = {
    tasklistId: number;
    list: ShoppingList;
}

export const ArchivedShoppingListsMenu = ({ list, tasklistId }: Props) => {
    const navigate = useNavigate();
    const [unarchiveShoppingList] = useUnarchiveShoppingListMutation()
    const [deleteList] = useDeleteShoppingListMutation()
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const { data: household } = useHousehold();

    const handleUnarchiveList = async () => {
        try {
            await unarchiveShoppingList({ listId: list.id, householdId: household?.id }).unwrap();
        } catch (err) {
            console.error("Failed to unarchive shopping list:", err);
        }
    }

    const handleDeleteList = async () => {
        try {
            await deleteList({ listId: list.id, householdId: household?.id }).unwrap();
        } catch (err) {
            console.error("Failed to delete shopping list:", err);
        }
    }

    return (
        <Menu
            loop={false}
            withinPortal={false}
            trapFocus={false}
            menuItemTabIndex={0} shadow="md" width={150}
        >
            <Menu.Target>
                <ActionIcon variant="subtle" color="rgb(5, 5, 73)" size='xs' onClick={(e) => e.stopPropagation()}>
                    <MoreVertRoundedIcon />
                </ActionIcon>
            </Menu.Target >
            <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
                <Menu.Item
                    leftSection={
                        <div className="archived-menu-icon">
                            <UnarchivedIcon size="1.25rem" color="rgb(55, 55, 72)" />
                        </div>
                    }
                    onClick={handleUnarchiveList}
                >
                    Restore
                </Menu.Item>
                <Menu.Item color="red.9" leftSection={<DeleteRounded />} onClick={() => setShowDeleteConfirmation(true)} >Delete</Menu.Item>
            </Menu.Dropdown>
            <DeleteConfirmation modalTitle="Delete shopping list" itemType="shopping list" itemName={list.title} opened={showDeleteConfirmation} setShowDeleteConfirmation={() => setShowDeleteConfirmation(false)} handleDeleteItem={handleDeleteList} />
        </Menu >
    )
}