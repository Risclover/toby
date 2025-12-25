import { useGetAnnouncementsQuery, useMarkAnnouncementsSeenBulkMutation } from "@/store/announcementSlice"
import "../styles/Announcements.css"
import { Button, Modal } from "@mantine/core";
import { act, useEffect, useMemo, useRef, useState } from "react";
import { CreateAnnouncement } from "./CreateAnnouncement";
import { formatAnnouncementTimestamp } from "../utils/formatAnnouncementTimestamp";
import { Announcement } from "./Announcement";
import AnnouncementsTabOptimistic from "./AnnouncementsTabOptimistic";

type Props = {
    householdId: number;
    activeTab: string | null;
}

type Announcement = {
    id: number;
    message: string;
    householdId: number;
    isImportant: boolean;
    createdAt?: string | null | undefined;
    seenByCurrent?: boolean | undefined;
}

export const Announcements = ({ householdId, activeTab }: Props) => {
    const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);

    const [openMenuAnnouncementId, setOpenMenuAnnouncementId] = useState<number | null>(null);

    const {
        data,
        isFetching,
        refetch,
    } = useGetAnnouncementsQuery({ householdId }, {
        skip: activeTab !== "announcements",
        refetchOnMountOrArgChange: true,
    });

    const [markSeen] = useMarkAnnouncementsSeenBulkMutation();

    /**
     * Guard so we only mark seen ONCE per tab entry
     * Prevents re-marking on re-renders
     */
    const hasMarkedSeenRef = useRef(false);

    /**
     * Reset guard whenever user leaves Announcements tab
     */
    useEffect(() => {
        if (activeTab !== "announcements") {
            hasMarkedSeenRef.current = false;
        }
    }, [activeTab]);

    /**
     * Mark unseen announcements as seen
     * ONLY when:
     * - Announcements tab is active
     * - Data is loaded
     * - We haven't already done it for this tab entry
     */
    useEffect(() => {
        if (activeTab !== "announcements") return;
        if (hasMarkedSeenRef.current) return;
        if (!data?.items.length) return;

        const unseenIds = data?.items
            .filter((a) => !a.seenByCurrent)
            .map((a) => a.id);

        if (unseenIds.length === 0) {
            hasMarkedSeenRef.current = true;
            return;
        }

        hasMarkedSeenRef.current = true;

        // Fire and forget — optimistic update is handled in the mutation
        markSeen({ householdId, announcementIds: unseenIds });
    }, [activeTab, data?.items, householdId, markSeen]);

    /**
     * Sort by:
     * - date
     * - alphabet
     * - important first
     * - unseen first
     */

    const sortedAnnouncements = useMemo(() => (data?.items ?? []).slice().sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;

        // Newest first
        return bTime - aTime;
    }), [data?.items]);

    const announcements = data?.items ?? [];
    const MAX_ANNOUNCEMENTS_DISPLAYED = 4;
    const unseenAnnouncements = announcements.filter(a => !a.seenByCurrent);
    const seenAnnouncements = announcements.filter(a => a.seenByCurrent);

    const visibleAnnouncements = unseenAnnouncements && unseenAnnouncements.length > MAX_ANNOUNCEMENTS_DISPLAYED ? unseenAnnouncements : [...unseenAnnouncements, ...seenAnnouncements].slice(0, MAX_ANNOUNCEMENTS_DISPLAYED);

    return <div className="announcements-container">
        {data?.items.length === 0 && <div>No announcements.</div>}
        {/* sort options dropdown (A-Z, Z-A, date ^, date v, importance) */}
        {visibleAnnouncements.map(announcement => <Announcement key={announcement?.id} creator={announcement?.creator} announcement={announcement} isMenuOpen={openMenuAnnouncementId === announcement?.id}
            onToggleMenu={() =>
                setOpenMenuAnnouncementId((prev) => (prev === announcement?.id ? null : announcement.id))
            }
            onCloseMenu={() => setOpenMenuAnnouncementId(null)} />
        )}
        {/* <Button onClick={() => setShowCreateAnnouncement(true)}>Add announcement</Button> */}
        {showCreateAnnouncement &&
            <CreateAnnouncement opened={showCreateAnnouncement} close={() => setShowCreateAnnouncement(false)} />
        }
    </div >
}