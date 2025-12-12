import { useGetAnnouncementsQuery } from "@/store/announcementSlice"
import "../styles/Announcements.css"
import { Button, Modal } from "@mantine/core";
import { useMemo, useState } from "react";
import { CreateAnnouncement } from "./CreateAnnouncement";
import { formatAnnouncementTimestamp } from "../utils/formatAnnouncementTimestamp";
import { Announcement } from "./Announcement";
import AnnouncementsTabOptimistic from "./AnnouncementsTabOptimistic";

type Props = {
    householdId: number;
}

type Announcement = {
    id: number;
    message: string;
    householdId: number;
    isImportant: boolean;
    createdAt?: string | null | undefined;
    seenByCurrent?: boolean | undefined;
}

export const Announcements = ({ householdId }: Props) => {
    const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);

    const [openMenuAnnouncementId, setOpenMenuAnnouncementId] = useState<number | null>(null);

    const { data: announcements } = useGetAnnouncementsQuery({ householdId });

    /**
     * Sort by:
     * - date
     * - alphabet
     * - important first
     * - unseen first
     */

    const sortedAnnouncements = useMemo(() => (announcements ?? []).slice().sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;

        // Newest first
        return bTime - aTime;
    }), [announcements]);

    const MAX_ANNOUNCEMENTS_DISPLAYED = 4;
    const unseenAnnouncements = announcements?.filter(a => !a.seenByCurrent);
    const seenAnnouncements = announcements?.filter(a => a.seenByCurrent);

    const visibleAnnouncements = unseenAnnouncements && unseenAnnouncements.length > MAX_ANNOUNCEMENTS_DISPLAYED ? unseenAnnouncements : [...unseenAnnouncements, ...seenAnnouncements].slice(0, MAX_ANNOUNCEMENTS_DISPLAYED);

    return <div className="announcements-container">
        {announcements?.length === 0 && <div>No announcements.</div>}
        {/* sort options dropdown (A-Z, Z-A, date ^, date v, importance) */}
        {/* {sortedAnnouncements?.map(announcement => <Announcement key={announcement.id} creator={announcement.creator} announcement={announcement} isMenuOpen={openMenuAnnouncementId === announcement.id}
            onToggleMenu={() =>
                setOpenMenuAnnouncementId((prev) => (prev === announcement.id ? null : announcement.id))
            }
            onCloseMenu={() => setOpenMenuAnnouncementId(null)} />
        ).slice(0, 4)} */}
        {/* <Button onClick={() => setShowCreateAnnouncement(true)}>Add announcement</Button> */}
        <AnnouncementsTabOptimistic />
        {showCreateAnnouncement &&
            <CreateAnnouncement opened={showCreateAnnouncement} close={() => setShowCreateAnnouncement(false)} />
        }
    </div >
}