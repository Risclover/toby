import { useDeleteAnnouncementMutation, useToggleAnnouncementImportanceMutation } from "@/store/announcementSlice"
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import React, { useState, type SetStateAction } from "react";

type Props = {
    announcement: {
        id: number;
        householdId: number;
        isImportant: boolean;
    };
    onCloseMenu: () => void;
    ref: React.RefObject<HTMLDivElement | null>;
    setOpenDeleteConfirmation: React.Dispatch<SetStateAction<boolean>>;
}

export const AnnouncementMenu = ({ ref, announcement, onCloseMenu, setOpenDeleteConfirmation }: Props) => {
    const [toggleImportance] = useToggleAnnouncementImportanceMutation();

    const handleToggleImportance = async () => {
        await toggleImportance({
            announcementId: announcement.id,
            isImportant: !announcement.isImportant,
            householdId: announcement.householdId,
        });
        onCloseMenu();
    }

    const handleDeleteAnnouncement = () => {
        setOpenDeleteConfirmation(true);
    }

    return (
        <div className="announcement-menu" ref={ref}>
            <button onClick={handleToggleImportance}>{!announcement.isImportant ? <WarningAmberRoundedIcon /> : <WarningRoundedIcon />}{announcement.isImportant ? "Remove importance" : "Mark important"}</button>
            <button onClick={handleDeleteAnnouncement}><DeleteRoundedIcon /> Delete</button>
        </div>
    )
}