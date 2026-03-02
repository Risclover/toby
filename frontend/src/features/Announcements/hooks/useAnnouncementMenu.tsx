import { useToggleAnnouncementImportanceMutation, type Announcement } from "@/store";
import type { SetStateAction } from "react";

type Props = {
    announcement: Announcement;
    ref: React.RefObject<HTMLButtonElement | null>;
    setOpenDeleteConfirmation: React.Dispatch<SetStateAction<boolean>>;
}
export const useAnnouncementMenu = ({ announcement, ref, setOpenDeleteConfirmation }: Props) => {
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

    return {
        handleToggleImportance, handleDeleteAnnouncement
    }
}