import { useGetAnnouncementsQuery } from "@/store/announcementSlice"
import "../styles/Announcements.css"
import { Button, Modal } from "@mantine/core";
import { useMemo, useState } from "react";
import { CreateAnnouncement } from "./CreateAnnouncement";
import { formatAnnouncementTimestamp } from "../utils/formatAnnouncementTimestamp";
import { Announcement } from "./Announcement";

type Props = {
    householdId: number;
}

export const Announcements = ({ householdId }: Props) => {
    const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
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

    console.log('sortedAnnouncements:', sortedAnnouncements);

    return <div className="announcements-container">
        {announcements?.length === 0 && <div>No announcements.</div>}
        {/* sort options dropdown (A-Z, Z-A, date ^, date v, importance) */}
        {sortedAnnouncements?.map(announcement => <Announcement key={announcement.id} creator={announcement.creator} announcement={announcement} />
        ).slice(0, 4)}
        {/* <Button onClick={() => setShowCreateAnnouncement(true)}>Add announcement</Button> */}

        {showCreateAnnouncement &&
            <CreateAnnouncement opened={showCreateAnnouncement} close={() => setShowCreateAnnouncement(false)} />
        }
    </div >
}