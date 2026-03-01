import { useState } from "react";
import { useDeleteAnnouncementMutation, type Announcement, type User } from "@/store";
import { formatAnnouncementTimestamp } from "../utils";

type Props = {
    announcement: Announcement;
    user: User;
}
export const useAnnouncement = ({ announcement, user }: Props) => {
    const [deleteAnnouncement] = useDeleteAnnouncementMutation();

    const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false);

    const userTimezone = user?.timezone;
    const formattedTimestamp = formatAnnouncementTimestamp(announcement.createdAt ?? null, userTimezone);

    const handleDeleteAnnouncement = async () => {
        await deleteAnnouncement({ announcementId: announcement.id, householdId: announcement.householdId });
        setOpenDeleteConfirmation(false);
    }

    return {
        handleDeleteAnnouncement,
        openDeleteConfirmation,
        setOpenDeleteConfirmation,
        formattedTimestamp
    }
}