// Announcements.tsx
import { useGetAnnouncementsQuery, useMarkAnnouncementsSeenBulkMutation } from "@/store/announcementSlice";
import "../styles/Announcements.css";
import { Button } from "@mantine/core";
import React, { useEffect, useRef, useState } from "react";
import { CreateAnnouncement } from "./CreateAnnouncement";
import { Announcement } from "./Announcement";
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import AddRoundedIcon from '@mui/icons-material/AddRounded';
export type FiltersType = {
    importance: "all" | "important";
    creatorId: number | null;
    time: "today" | "7days" | "30days" | "all";
};

type Props = {
    householdId: number;
    activeTab?: string | null;
    maxDisplayed?: number;
    fullPage?: boolean;
    sortOption?: null | "Newest" | "Oldest" | "Important first";
    searchValue?: string;
    filters?: FiltersType;
};

export const Announcements = ({
    householdId,
    activeTab = null,
    maxDisplayed = 4,
    fullPage = false,
    sortOption = null,
    searchValue = "",
    filters = { importance: "all", creatorId: null, time: "all" }, // default filters
}: Props) => {
    const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
    const [requestedPage, setRequestedPage] = useState(1);
    const [openMenuAnnouncementId, setOpenMenuAnnouncementId] = useState<number | null>(null);
    const hasMarkedSeenRef = useRef(false);

    const queryLimit = fullPage ? 10 : 50;
    const shouldSkip = !fullPage && activeTab !== "announcements";

    // Stable query args
    const queryArgs = {
        householdId,
        limit: queryLimit,
        page: requestedPage,
        search: searchValue.trim() || undefined,
        sort: sortOption || undefined,
        importance: filters.importance !== "all" ? filters.importance : undefined,
        creatorId: filters.creatorId ?? undefined,
        time: filters.time !== "all" ? filters.time : undefined,
    };

    const { data, isFetching } = useGetAnnouncementsQuery(queryArgs, { skip: shouldSkip });
    const [markSeen] = useMarkAnnouncementsSeenBulkMutation();

    // Reset seen guard if leaving tab
    useEffect(() => {
        if (activeTab !== "announcements") hasMarkedSeenRef.current = false;
    }, [activeTab]);

    // Reset requestedPage when filters/search/sort change
    useEffect(() => {
        if (fullPage) setRequestedPage(1);
    }, [searchValue, fullPage, sortOption, filters]);

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

    // Determine visible announcements (slice only for homepage cards)
    let visibleAnnouncements = data?.items ?? [];
    if (!fullPage) {
        const unseen = visibleAnnouncements.filter(a => !a.seenByCurrent);
        const seen = visibleAnnouncements.filter(a => a.seenByCurrent);
        visibleAnnouncements = unseen.length >= maxDisplayed
            ? unseen.slice(0, maxDisplayed)
            : [...unseen, ...seen].slice(0, maxDisplayed);
    }

    // Pagination handlers with clamping
    const loadNextPage = () => {
        if (!data?.totalPages) return;
        setRequestedPage(prev => Math.min(prev + 1, data.totalPages));
    };

    const loadPrevPage = () => {
        setRequestedPage(prev => Math.max(prev - 1, 1));
    };

    // Displayed page should never exceed totalPages
    const displayedPage = Math.min(requestedPage, data?.totalPages ?? requestedPage);

    return (
        <div className="announcements-container">
            <div className="announcements-top-bar">
                {fullPage && visibleAnnouncements.length > 0 && (
                    <div className="pagination-buttons">
                        <Button color="rgb(5, 5, 73)" onClick={loadPrevPage} disabled={displayedPage === 1} size="compact-xs" style={{ marginRight: "0.5rem" }}>
                            <ChevronLeftRoundedIcon />
                        </Button>
                        <Button color="rgb(5, 5, 73)" size="compact-xs" onClick={loadNextPage} disabled={displayedPage === (data?.totalPages ?? displayedPage)}>
                            <ChevronRightRoundedIcon />
                        </Button>
                        <span style={{ marginLeft: "1rem" }}>
                            Page {displayedPage} {data?.totalPages ? `of ${data.totalPages}` : ""}
                        </span>
                    </div>
                )}
                <Button color="rgb(5, 5, 73)" variant="light" size="compact-xs">+ Add</Button>
            </div>

            {isFetching && !data?.items?.length ? (
                <div>Loading...</div>
            ) : visibleAnnouncements.length === 0 ? (
                <div>No results found.</div>
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
