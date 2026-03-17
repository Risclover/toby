import React, { type SetStateAction } from "react";
import { ActionIcon, Menu } from "@mantine/core";
import { IoEllipsisVerticalSharp } from "react-icons/io5";
import { useAnnouncementMenu } from "../hooks/useAnnouncementMenu";
import { type Announcement } from "@/store"
import { StarIcon, StarIconOutline, MenuTrashIcon } from "@/assets";
import DeleteRounded from '@mui/icons-material/Delete';

type Props = {
    announcement: Announcement;
    ref: React.RefObject<HTMLButtonElement | null>;
    setOpenDeleteConfirmation: React.Dispatch<SetStateAction<boolean>>;
}

export const AnnouncementMenu = ({ ref, announcement, setOpenDeleteConfirmation }: Props) => {
    const {
        handleToggleImportance,
        handleDeleteAnnouncement
    } = useAnnouncementMenu({ announcement, setOpenDeleteConfirmation, ref })

    return (
        <Menu
            withinPortal={true}
            menuItemTabIndex={0}
            shadow="xs"
            width={200}
        >
            <Menu.Target>
                <ActionIcon
                    ref={ref}
                    p={0}
                    className="announcement-menu-btn"
                    variant="transparent"
                    color="var(--mantine-color-gray-6)"
                    size="xs"
                >
                    <IoEllipsisVerticalSharp />
                </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Item
                    leftSection={
                        <div className="archived-menu-icon">
                            {!announcement.isImportant ?
                                <StarIconOutline color="rgb(55, 55, 72)" size="20px" /> :
                                <StarIcon size="20px" color="rgb(55, 55, 72)" />
                            }
                        </div>
                    }
                    onClick={handleToggleImportance}
                >
                    {announcement.isImportant ? "Remove importance" : "Mark important"}
                </Menu.Item>
                <Menu.Item
                    color="red.9"
                    leftSection={
                        <DeleteRounded fontSize="small" />
                    }
                    onClick={handleDeleteAnnouncement}
                >
                    Delete
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    )
}