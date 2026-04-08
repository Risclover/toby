import { useNavigate } from "react-router-dom";
import { ActionIcon, Menu } from "@mantine/core"
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import DeleteRounded from '@mui/icons-material/Delete';

import { ViewIcon, UnarchivedIcon, MenuTrashIcon } from "@/assets";
import { useTasklistSettings, useUndoArchive } from "../../hooks";

type Props = {
    tasklistId: number;
}

export const ArchivedHouseholdTasklistsMenu = ({ tasklistId }: Props) => {
    const navigate = useNavigate();
    const { handleUndoArchive } = useUndoArchive({ tasklistId });
    const { handleDeleteList } = useTasklistSettings({ tasklistId });

    const handleView = () => {
        navigate(`/tasklists/${tasklistId}`)
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
            <Menu.Dropdown>
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
                <Menu.Item color="red.9" leftSection={<DeleteRounded />}>Delete</Menu.Item>
            </Menu.Dropdown>
        </Menu >
    )
}