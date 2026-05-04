import { useNavigate } from "react-router-dom";
import { ActionIcon, Menu } from "@mantine/core"
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import DeleteRounded from '@mui/icons-material/Delete';

import { ViewIcon, UnarchivedIcon, MenuTrashIcon } from "@/assets";
import { useTasklistSettings, useUndoArchive } from "../../hooks";
import { DeleteConfirmation } from "@/components";
import { useState } from "react";
import type { TasklistType } from "@/store";

type Props = {
    tasklistId: number;
    list: TasklistType;
}

export const ArchivedHouseholdTasklistsMenu = ({ list, tasklistId }: Props) => {
    const navigate = useNavigate();
    const { handleUndoArchive } = useUndoArchive({ tasklistId });
    const { handleDeleteList } = useTasklistSettings({ tasklistId });
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);


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
                    onClick={handleUndoArchive}
                >
                    Restore
                </Menu.Item>
                <Menu.Item color="red.9" leftSection={<DeleteRounded />} onClick={() => setShowDeleteConfirmation(true)} >Delete</Menu.Item>
            </Menu.Dropdown>
            <DeleteConfirmation modalTitle="Delete tasklist" itemType="tasklist" itemName={list.title} opened={showDeleteConfirmation} setShowDeleteConfirmation={() => setShowDeleteConfirmation(false)} handleDeleteItem={handleDeleteList} />
        </Menu >
    )
}