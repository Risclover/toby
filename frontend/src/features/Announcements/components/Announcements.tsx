import { useGetAnnouncementsQuery, useMarkAnnouncementsSeenBulkMutation } from "@/store/announcementSlice";
import "../styles/Announcements.css";
import { Button, TextInput, CloseButton } from "@mantine/core";
import React, { useEffect, useRef, useState, type SetStateAction } from "react";
import { CreateAnnouncement } from "./CreateAnnouncement";
import { Announcement } from "./Announcement";

type Props = {
    householdId: number;
    activeTab?: string | null;
    maxDisplayed?: number; // Only used in homepage mode
    fullPage?: boolean; // Toggle between full page or homepage view
    sortOption: "" | "Newest" | "Oldest" | "Important first";
    setSortOption: React.Dispatch<SetStateAction<"" | "Newest" | "Oldest" | "Important first">>;
    searchValue: string;
    setSearchValue: React.Dispatch<SetStateAction<string>>;
};

export const Announcements = ({
    householdId,
    activeTab = null,
    maxDisplayed = 4,
    fullPage = false,
    sortOption,
    setSortOption,
    searchValue,
    setSearchValue
}: Props) => {
    const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
    const [page, setPage] = useState(1);
    const [openMenuAnnouncementId, setOpenMenuAnnouncementId] = useState<number | null>(null);

    const queryLimit = fullPage ? 10 : 50;
    const shouldSkip = !fullPage && activeTab !== "announcements";

    // Fetch announcements from backend
    const { data, isFetching } = useGetAnnouncementsQuery(
        {
            householdId,
            limit: queryLimit,
            page,
            search: fullPage && searchValue.trim() ? searchValue.trim() : undefined,
            sort: fullPage && sortOption ? sortOption : undefined,
        },
        { skip: shouldSkip, refetchOnMountOrArgChange: true }
    );

    const [markSeen] = useMarkAnnouncementsSeenBulkMutation();
    const hasMarkedSeenRef = useRef(false);

    // Reset page on search change
    useEffect(() => {
        if (fullPage) setPage(1);
    }, [searchValue, fullPage, sortOption]);


    // Reset seen guard if leaving tab
    useEffect(() => {
        if (activeTab !== "announcements") hasMarkedSeenRef.current = false;
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

    // Determine visible announcements
    let visibleAnnouncements = data?.items ?? [];

    // Homepage mode: show maxDisplayed with unseen first
    if (!fullPage) {
        const unseen = visibleAnnouncements.filter(a => !a.seenByCurrent);
        const seen = visibleAnnouncements.filter(a => a.seenByCurrent);

        visibleAnnouncements = unseen.length >= maxDisplayed
            ? unseen.slice(0, maxDisplayed)
            : [...unseen, ...seen].slice(0, maxDisplayed);
    }

    // Pagination handlers
    const loadNextPage = () => { if (data?.hasNextPage) setPage(prev => prev + 1); };
    const loadPrevPage = () => { if (page > 1) setPage(prev => prev - 1); };

    return (
        <div className="announcements-container">

            {/* Pagination */}
            {fullPage && (
                <div className="pagination-buttons" style={{ marginBottom: "1rem" }}>
                    <Button onClick={loadPrevPage} disabled={page === 1} style={{ marginRight: "0.5rem" }}>
                        Previous Page
                    </Button>
                    <Button onClick={loadNextPage} disabled={!data?.hasNextPage}>
                        Next Page
                    </Button>
                    <span style={{ marginLeft: "1rem" }}>
                        Page {page} {data?.totalPages ? `of ${data.totalPages}` : ""}
                    </span>
                </div>
            )}

            {/* Loading / empty state */}
            {isFetching && !data?.items?.length ? (
                <div>Loading...</div>
            ) : visibleAnnouncements.length === 0 ? (
                <div>No announcements.</div>
            ) : (
                visibleAnnouncements.map(a => (
                    <Announcement
                        key={a.id}
                        creator={a.creator}
                        announcement={a}
                        isMenuOpen={openMenuAnnouncementId === a.id}
                        onToggleMenu={() => setOpenMenuAnnouncementId(prev => (prev === a.id ? null : a.id))}
                        onCloseMenu={() => setOpenMenuAnnouncementId(null)}
                    />
                ))
            )}

            {showCreateAnnouncement && (
                <CreateAnnouncement opened={showCreateAnnouncement} close={() => setShowCreateAnnouncement(false)} />
            )}
        </div>
    );
};
