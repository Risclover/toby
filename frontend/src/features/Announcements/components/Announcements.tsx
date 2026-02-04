// Announcements.tsx
import { useGetAnnouncementsQuery, useMarkAnnouncementsSeenBulkMutation } from "@/store/announcementSlice";
import "../styles/Announcements.css";
import { Button, Center, Loader, ScrollArea, Skeleton } from "@mantine/core";
import React, { useEffect, useRef, useState } from "react";
import { CreateAnnouncement } from "./CreateAnnouncement";
import { Announcement } from "./Announcement";
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useIsSmallScreen } from "@/hooks/useIsSmallScreen";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useStablePending } from "@/hooks";
import { useScrollProgress } from "@/hooks/useScrollProgress";

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
    const [scrollPos, setScrollPos] = useState({ x: 0, isEnd: false });

    // Update position and check if we've reached the end
    const handleScroll = ({ x }: { x: number }) => {
        setScrollPos((prev) => ({ ...prev, x }));
    };

    // Determine the mask based on scroll position
    // Adjust '20' to be your "threshold" for when the fade appears
    const getMask = () => {
        const showLeft = scrollPos.x > 20;
        const showRight = !scrollPos.isEnd;

        if (showLeft && showRight) {
            return 'linear-gradient(to right, transparent, black 8%, black 95%, transparent)';
        } else if (showLeft) {
            return 'linear-gradient(to right, transparent, black 8%)';
        } else if (showRight) {
            return 'linear-gradient(to left, transparent, black 8%)';
        }
        return 'none';
    };
    const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
    const [requestedPage, setRequestedPage] = useState(1);
    const [openMenuAnnouncementId, setOpenMenuAnnouncementId] = useState<number | null>(null);
    const hasMarkedSeenRef = useRef(false);
    const isSmall = useIsSmallScreen();
    const prevPageRef = useRef(requestedPage);


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

    const { data, isFetching, isLoading, refetch } = useGetAnnouncementsQuery(queryArgs, { skip: shouldSkip });
    const [markSeen] = useMarkAnnouncementsSeenBulkMutation();


    // Refetch and reset seen guard when entering the announcements tab
    useEffect(() => {
        if (activeTab === "announcements" && !shouldSkip) {
            hasMarkedSeenRef.current = false; // Reset flag when entering tab
            refetch(); // Fetch latest data
        }
    }, [activeTab, refetch, shouldSkip]);

    // Reset requestedPage when filters/search/sort change on full page
    useEffect(() => {
        if (fullPage) setRequestedPage(1);
    }, [searchValue, fullPage, sortOption, filters]);

    // Mark unseen announcements as seen shortly after tab is opened
    useEffect(() => {
        // Wait for refetch to complete before marking as seen
        if (activeTab !== "announcements" || isFetching || hasMarkedSeenRef.current || !data?.items?.length) return;

        const unseenIds = data.items.filter(a => !a.seenByCurrent).map(a => a.id);
        if (unseenIds.length === 0) {
            hasMarkedSeenRef.current = true;
            return;
        }

        // Small delay so "New" state is actually visible for a moment
        const timeoutId = window.setTimeout(() => {
            hasMarkedSeenRef.current = true;
            markSeen({ householdId, announcementIds: unseenIds });
        }, 500);

        return () => window.clearTimeout(timeoutId);
    }, [activeTab, data?.items, householdId, markSeen, isFetching]);

    // Determine visible announcements
    let visibleAnnouncements = data?.items ?? [];

    // Homepage behavior (not full page)
    if (!fullPage) {
        const unseen = visibleAnnouncements.filter(a => !a.seenByCurrent);
        const seen = visibleAnnouncements.filter(a => a.seenByCurrent);

        if (unseen.length > maxDisplayed) {
            // If there are more unseen than maxDisplayed, show ALL unseen so none are missed
            visibleAnnouncements = unseen;
        } else {
            // Otherwise show up to maxDisplayed, unseen first then seen
            visibleAnnouncements = [...unseen, ...seen].slice(0, maxDisplayed);
        }
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

    useEffect(() => {
        // Only scroll if the page has explicitly changed since the last render
        if (prevPageRef.current !== requestedPage) {
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });

            // Update the ref to the new current page
            prevPageRef.current = requestedPage;
        }
    }, [requestedPage]);

    const loading = useStablePending(isFetching, { showAfterMs: 120, minVisibleMs: 500 });

    // 3. Now handle the empty state
    if (visibleAnnouncements.length === 0) {
        return <div className="no-results">No results found.</div>;
    }
    return (
        <div className="announcements-container announcement-mask-container">
            <ScrollArea scrollbarSize={8} offsetScrollbars className="scroll-mask"
                style={{ '--mask-edges': getMask() } as any}
                onScrollPositionChange={handleScroll}
                // Use viewportRef to detect the actual scroll width for "isEnd" logic
                viewportRef={(ref) => {
                    if (ref) {
                        const isAtEnd = ref.scrollLeft + ref.clientWidth >= ref.scrollWidth - 20;
                        if (isAtEnd !== scrollPos.isEnd) {
                            setScrollPos(p => ({ ...p, isEnd: isAtEnd }));
                        }
                    }
                }}
                styles={{
                    content: {
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'nowrap',
                        gap: '1rem',
                    }
                }
                }>
                {isLoading && visibleAnnouncements.length > 0 ? (
                    <><AnnouncementSkeleton /><AnnouncementSkeleton /><AnnouncementSkeleton /></>
                ) : visibleAnnouncements.length === 0 && !isFetching && !isLoading ? (
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

                {fullPage && visibleAnnouncements.length > 0 && (
                    <div className={`pagination-buttons mobile`}>
                        <Button
                            color="rgb(5, 5, 73)"
                            onClick={loadPrevPage}
                            disabled={displayedPage === 1}
                            size="compact-xs"
                            style={{ marginRight: "0.5rem" }}
                        >
                            <ChevronLeftRoundedIcon />
                        </Button>
                        <span>
                            Page {displayedPage} {data?.totalPages ? `of ${data.totalPages}` : ""}
                        </span>
                        <Button
                            color="rgb(5, 5, 73)"
                            size="compact-xs"
                            onClick={loadNextPage}
                            disabled={displayedPage === (data?.totalPages ?? displayedPage)}
                        >
                            <ChevronRightRoundedIcon />
                        </Button>
                    </div>
                )}
            </ScrollArea>
        </div >
    );
};

const AnnouncementSkeleton = () => {
    return (
        <div className="single-announcement">
            <div className="single-announcement-header">
                <div className="single-announcement-header-left">
                    <Skeleton height="26px" width="26px" radius="xl" mr="0.5rem" />
                    <div className="single-announcement-header-info">
                        <Skeleton height={6} width={50} radius="xl" />
                        <Skeleton height={6} width={80} radius="xl" mt="0.55rem" />
                    </div>
                </div>
                <div className="single-announcement-header-right">
                    <div className="single-announcement-skeleton-menu-button">
                        <Skeleton radius="xl" height={3} width={3} />
                        <Skeleton radius="xl" height={3} width={3} />
                        <Skeleton radius="xl" height={3} width={3} />
                    </div>
                </div>
            </div>
            <Skeleton height={7} width="100%" radius="xl" mt="0.55rem" />
            <Skeleton height={7} width="100%" radius="xl" mt="0.5rem" />
            <Skeleton height={7} width="60%" radius="xl" mt="0.5rem" />

        </div>
    )
}