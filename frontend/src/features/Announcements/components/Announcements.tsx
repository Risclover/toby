import { useGetAnnouncementsQuery, useMarkAnnouncementsSeenBulkMutation } from "@/store/announcementSlice";
import "../styles/Announcements.css";
import { Button } from "@mantine/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { CreateAnnouncement } from "./CreateAnnouncement";
import { Announcement } from "./Announcement";

type Props = {
    householdId: number;
    activeTab?: string | null;
    maxDisplayed?: number; // Only used in homepage mode
    fullPage?: boolean; // Toggle between full page or homepage view
};

export const Announcements = ({ householdId, activeTab = null, maxDisplayed = 4, fullPage = false }: Props) => {
    const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
    const [page, setPage] = useState(1);
    const [openMenuAnnouncementId, setOpenMenuAnnouncementId] = useState<number | null>(null);

    // Determine limit for query
    const queryLimit = fullPage ? 10 : 50; // 50 for homepage to slice visibleAnnouncements

    const { data, isFetching } = useGetAnnouncementsQuery(
        { householdId, limit: queryLimit, page: fullPage ? page : undefined },
        { skip: activeTab !== null && activeTab !== "announcements", refetchOnMountOrArgChange: true }
    );

    const [markSeen] = useMarkAnnouncementsSeenBulkMutation();
    const hasMarkedSeenRef = useRef(false);

    // Reset seen guard if leaving tab
    useEffect(() => {
        if (activeTab !== "announcements") {
            hasMarkedSeenRef.current = false;
        }
    }, [activeTab]);

    // Mark unseen announcements as seen
    useEffect(() => {
        if (activeTab !== "announcements" || hasMarkedSeenRef.current || !data?.items?.length) return;

        const unseenIds = data.items.filter(a => !a.seenByCurrent).map(a => a.id);
        if (unseenIds.length === 0) {
            hasMarkedSeenRef.current = true;
            return;
        }

        hasMarkedSeenRef.current = true;
        markSeen({ householdId, announcementIds: unseenIds });
    }, [activeTab, data?.items, householdId, markSeen]);

    // Sort announcements by newest first
    const sortedAnnouncements = useMemo(() => (data?.items ?? []).slice().sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
    }), [data?.items]);

    // Determine visible announcements
    let visibleAnnouncements = sortedAnnouncements;

    if (!fullPage) {
        const unseenAnnouncements = sortedAnnouncements.filter(a => !a.seenByCurrent);
        const seenAnnouncements = sortedAnnouncements.filter(a => a.seenByCurrent);

        visibleAnnouncements =
            unseenAnnouncements.length >= maxDisplayed
                ? unseenAnnouncements.slice(0, maxDisplayed)
                : [...unseenAnnouncements, ...seenAnnouncements].slice(0, maxDisplayed);
    }

    // Pagination handlers (only for fullPage)
    const loadNextPage = () => { if (data?.hasNextPage) setPage(prev => prev + 1); };
    const loadPrevPage = () => { if (page > 1) setPage(prev => prev - 1); };

    return (
        <div className="announcements-container">
            {fullPage && (
                <div className="pagination-buttons" style={{ marginBottom: "1rem" }}>
                    <Button onClick={loadPrevPage} disabled={page === 1 || isFetching} style={{ marginRight: "0.5rem" }}>
                        Previous Page
                    </Button>
                    <Button onClick={loadNextPage} disabled={!data?.hasNextPage || isFetching}>
                        Next Page
                    </Button>
                    <span style={{ marginLeft: "1rem" }}>
                        Page {page} {data?.totalPages ? `of ${data.totalPages}` : ""}
                    </span>
                </div>
            )}

            {visibleAnnouncements.length === 0 && <div>No announcements.</div>}

            {visibleAnnouncements.map(a => (
                <Announcement
                    key={a.id}
                    creator={a.creator}
                    announcement={a}
                    isMenuOpen={openMenuAnnouncementId === a.id}
                    onToggleMenu={() => setOpenMenuAnnouncementId(prev => (prev === a.id ? null : a.id))}
                    onCloseMenu={() => setOpenMenuAnnouncementId(null)}
                />
            ))}

            {showCreateAnnouncement &&
                <CreateAnnouncement opened={showCreateAnnouncement} close={() => setShowCreateAnnouncement(false)} />
            }
        </div>
    );
};
