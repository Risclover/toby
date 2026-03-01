import { useDeleteAnnouncementMutation, useToggleAnnouncementImportanceMutation } from "@/store/announcementSlice"
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import React, { useRef, useState, type SetStateAction } from "react";
import { StarIcon, StarIconOutline, MenuTrashIcon } from "@/assets";
import { ActionIcon, Menu } from "@mantine/core";
import { IoEllipsisVerticalSharp } from "react-icons/io5";

type Props = {
    announcement: {
        id: number;
        householdId: number;
        isImportant: boolean;
    };
    ref: React.RefObject<HTMLButtonElement | null>;
    setOpenDeleteConfirmation: React.Dispatch<SetStateAction<boolean>>;
}

export const AnnouncementMenu = ({ ref, announcement, setOpenDeleteConfirmation }: Props) => {
    const [toggleImportance] = useToggleAnnouncementImportanceMutation();

    const handleToggleImportance = async () => {
        await toggleImportance({
            announcementId: announcement.id,
            isImportant: !announcement.isImportant,
            householdId: announcement.householdId,
        });
        ref.current?.focus();
    }

    const handleDeleteAnnouncement = () => {
        setOpenDeleteConfirmation(true);
        ref.current?.focus();
    }

    return (
        <Menu
            withinPortal={true}
            menuItemTabIndex={0}
            shadow="xs"
            width={200}
        >
            <Menu.Target>
                <ActionIcon ref={ref} p={0} className="announcement-menu-btn" variant="transparent" color="var(--mantine-color-gray-6)" size="xs">
                    <IoEllipsisVerticalSharp />
                </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Item
                    leftSection={
                        <div className="archived-menu-icon">
                            {!announcement.isImportant ? <StarIconOutline color="rgb(55, 55, 72)" size="16px" /> : <StarIcon size="16px" color="rgb(55, 55, 72)" />}
                        </div>
                    }
                    onClick={handleToggleImportance}
                >
                    {announcement.isImportant ? "Remove importance" : "Mark important"}
                </Menu.Item>
                <Menu.Item color="red.7" leftSection={<MenuTrashIcon size="16px" color="var(--mantine-color-red-7)" />} onClick={handleDeleteAnnouncement}>Delete</Menu.Item>
            </Menu.Dropdown>
        </Menu>
    )
}