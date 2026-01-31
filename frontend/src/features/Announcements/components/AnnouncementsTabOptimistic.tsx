import React, { useEffect, useRef, useState } from "react";
import {
    useGetAnnouncementsQuery,
    useMarkAnnouncementsSeenBulkMutation,
    announcementApi
} from "@/store/announcementSlice";
import { useAppDispatch } from "@/store/hooks";
import { formatAnnouncementTimestamp } from "../utils/formatAnnouncementTimestamp";
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import { Button } from "@mantine/core";
import { IoEllipsisVerticalSharp } from "react-icons/io5";
import { AnnouncementMenu } from "./AnnouncementMenu";
import { useOutsideClick } from "@/hooks/useOutsideClick";

type Props = {
    creator: {
        name: string;
        profileImg: string;
    };
    announcement: {
        id: number; // make sure you have this
        message: string;
        createdAt?: string | null | undefined;
        isImportant: boolean;
    };
    isMenuOpen: boolean;
    onToggleMenu: () => void;
    onCloseMenu: () => void;
    householdId: number;
    active: boolean;
};

export function AnnouncementsTabOptimistic({ creator, householdId, active, isMenuOpen, onToggleMenu, onCloseMenu }: Props) {
    const dispatch = useAppDispatch();
    const { data: announcements } = useGetAnnouncementsQuery({ householdId });
    const [markBulk] = useMarkAnnouncementsSeenBulkMutation();
    const timerRef = useRef<number | null>(null);
    const wrapperRef = useRef(null);
    const [showAnnouncementMenu, setShowAnnouncementMenu] = useState(false);
    useOutsideClick(wrapperRef, () => onCloseMenu(), isMenuOpen);

    useEffect(() => {
        if (!active) {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        const unseen = (announcements ?? []).filter(a => !a.seenByCurrent);
        const unseenIds = unseen.map(a => a.id);
        if (unseenIds.length === 0) return;

        // Wait a bit so quick tab flips don't mark as seen
        timerRef.current = window.setTimeout(() => {
            // Optimistically update local cache
            const patch = dispatch(
                announcementApi.util.updateQueryData(
                    "getAnnouncements",
                    { householdId },
                    draft => {
                        for (const item of draft) {
                            if (unseenIds.includes(item.id)) {
                                item.seenByCurrent = true;
                            }
                        }
                    }
                )
            );

            // Call backend batch endpoint
            (async () => {
                try {
                    await markBulk({ householdId, announcementIds: unseenIds }).unwrap();
                } catch (err) {
                    // On failure, invalidate so server canonical state refreshes
                    console.error("Failed to mark bulk seen", err);
                    dispatch(announcementApi.util.invalidateTags([{ type: "Announcement", id: `HOUSEHOLD_${householdId}` }]));
                    // optionally: patch.undo() if you want to roll back immediately:
                    // patch.undo();
                }
            })();

            timerRef.current = null;
        }, 800);

        return () => {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [active, announcements, householdId, dispatch, markBulk]);

    // compute visibleAnnouncements per your rule:
    const MAX_VISIBLE = 4;
    const allAnnouncements = announcements ?? [];

    const unseenList = allAnnouncements.filter(a => !a.seenByCurrent);
    const seenList = allAnnouncements.filter(a => a.seenByCurrent);

    const visibleAnnouncements =
        unseenList.length > MAX_VISIBLE
            ? unseenList.slice() // show all unseen if they exceed max
            : [...unseenList, ...seenList].slice(0, MAX_VISIBLE);

    const hiddenCount = (announcements ?? []).length - visibleAnnouncements.length;

    return (
        <div className="announcements-container">
            {visibleAnnouncements.map(a => <div className={`single-announcement${a.isImportant ? " important-announcement" : ""}`}>
                <div className="single-announcement-header">
                    <div className="single-announcement-header-left">
                        <img src={creator.profileImg} />
                        <div className="single-announcement-header-info">
                            <span className="single-announcement-creator">{creator.name}</span>
                            <span className="single-announcement-timestamp">{(() => {
                                const ts = formatAnnouncementTimestamp(a.createdAt ?? null);
                                return typeof ts === "string" ? ts : `${ts.day} · ${ts.time}`;
                            })()}</span>
                        </div>
                    </div>
                    <div className="single-announcement-header-right">
                        {a.isImportant && <div className="single-announcement-importance-label">
                            <WarningAmberRoundedIcon /> Important
                        </div>}
                        <button data-outside-ignore className="announcement-menu-btn" onClick={onToggleMenu}>
                            <IoEllipsisVerticalSharp />
                        </button>
                    </div>
                    {/* {isMenuOpen && <AnnouncementMenu ref={wrapperRef} announcement={a} />} */}
                </div>

                {a.message}
            </div>)}

            {hiddenCount > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
                    +{hiddenCount} more announcement{hiddenCount !== 1 ? "s" : ""} — <a href={`/households/${householdId}/announcements`}>View all</a>
                </div>
            )}
        </div>
    );
}
