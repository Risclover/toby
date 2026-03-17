import { ActionIcon, Menu, Tooltip } from "@mantine/core"
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import DeleteRounded from '@mui/icons-material/Delete';

import { MenuTrashIcon, ArchivedIcon } from "@/assets";
import { useTasklistSettings } from "../../hooks";
import { CopyIcon } from "@/assets/icons/CopyIcon";
import type React from "react";

type Props = {
    tasklistId: number;
    setShowDeleteConfirmation: (val: boolean) => void;
}
export const TasklistActionsMenu = ({ tasklistId, setShowDeleteConfirmation }: Props) => {
    const { handleDuplicateList, handleArchiveList } = useTasklistSettings({ tasklistId });

    return (
        <div
            className="menu-wrapper"
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                }
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <Menu
                loop={false}
                withinPortal={false}
                trapFocus={false}
                menuItemTabIndex={0} shadow="md" width={150}
            >
                <Tooltip label="Tasklist actions">
                    <Menu.Target>
                        <ActionIcon variant="transparent" color="var(--mantine-color-gray-6)" size='xs' onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                            }
                        }}
                            // Ensure click still stops bubbling
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}>
                            <MoreVertRoundedIcon fontSize="small" />
                        </ActionIcon>
                    </Menu.Target>
                </Tooltip>
                <Menu.Dropdown>
                    <Menu.Item
                        tabIndex={0}
                        leftSection={
                            <div className="archived-menu-icon">
                                <ArchivedIcon size="20px" color="rgb(55, 55, 72)" />
                            </div>
                        }
                        onClick={(e) => { e.stopPropagation(); handleArchiveList() }}
                    >
                        Archive
                    </Menu.Item>
                    <Menu.Item
                        leftSection={
                            <div className="archived-menu-icon">
                                <CopyIcon size="20px" color="rgb(55, 55, 72)" />
                            </div>
                        }
                        onClick={(e) => { e.stopPropagation(); handleDuplicateList() }}
                    >
                        Duplicate
                    </Menu.Item>
                    <Menu.Item color="red.9" leftSection={<DeleteRounded fontSize="small" />} onClick={(e) => { e.stopPropagation(); setShowDeleteConfirmation(true) }}>Delete</Menu.Item>
                </Menu.Dropdown>
            </Menu>
        </div>
    )
}