import { useState } from "react";
import { useNoticeBoard } from "@/contexts";
import { NoticeBoardAnnouncement } from "./NoticeBoardAnnouncement";
import { NoticeBoardAnnouncementsFilter } from "./NoticeBoardAnnouncementsFilter";
import { CreateAnnouncement } from "./CreateAnnouncement";
import { useAnnouncements } from "../hooks/useAnnouncements";
import { getVisibleAnnouncements } from "../utils/getVisibleAnnouncements";
import "../styles/Announcements.css";

export const NoticeBoardAnnouncements = () => {
    const [importanceFilter, setImportanceFilter] = useState(false);
    const { data, isLoading } = useAnnouncements();
    const { unseenSnapshot } = useNoticeBoard();

    if (isLoading || !data) return <div>Loading sillybutt</div>;

    const windowed = getVisibleAnnouncements(data.items, unseenSnapshot);
    const displayed = importanceFilter ? windowed.filter(a => a.isImportant) : windowed;
    const displayedCount = displayed.length;
    const hasAnyAnnouncements = windowed.length > 0;
    const showNoAnnouncements = !hasAnyAnnouncements;
    const showNoImportantAnnouncements = hasAnyAnnouncements && importanceFilter && displayedCount === 0;

    return (
        <div className="notice-board-announcements-container">
            <div className="notice-board-announcements-filter">
                <span className="announcements-count">
                    Showing latest ({displayedCount} item{displayedCount !== 1 ? "s" : ""})
                </span>
                <NoticeBoardAnnouncementsFilter setImportanceFilter={setImportanceFilter} />
            </div>

            <div className="notice-board-announcements">
                {displayedCount > 0 && (
                    <ul>
                        {displayed.map(announcement => (
                            <NoticeBoardAnnouncement
                                key={announcement.id}
                                announcement={announcement}
                            />
                        ))}
                    </ul>
                )}

                {showNoAnnouncements && (
                    <div className="empty-announcements">
                        There's nothing here. You should announce something!
                    </div>
                )}

                {showNoImportantAnnouncements && (
                    <div className="empty-announcements">
                        Looks like your household has nothing important to say right now. Check back later!
                    </div>
                )}
            </div>

            <CreateAnnouncement />
        </div>
    );
};