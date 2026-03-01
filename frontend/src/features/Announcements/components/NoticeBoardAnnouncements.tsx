import { useState } from "react";
import { useNoticeBoard } from "@/contexts";
import { NoticeBoardAnnouncement } from "./NoticeBoardAnnouncement";
import { NoticeBoardAnnouncementsFilter } from "./NoticeBoardAnnouncementsFilter";
import { CreateAnnouncement } from "./CreateAnnouncement";
import { useAnnouncements } from "../hooks/useAnnouncements";
import { getVisibleAnnouncements } from "../utils/getVisibleAnnouncements";

export const NoticeBoardAnnouncements = () => {
    const [importanceFilter, setImportanceFilter] = useState(false);
    const { data, isLoading } = useAnnouncements();
    const { unseenSnapshot } = useNoticeBoard();

    if (isLoading || !data) return <div>Loading sillybutt</div>;

    const windowed = getVisibleAnnouncements(data.items, unseenSnapshot);
    const displayed = importanceFilter ? windowed.filter(a => a.isImportant) : windowed;
    const displayedCount = displayed.length;

    return (
        <div className="notice-board-announcements-container">
            <div className="notice-board-announcements-filter">
                {displayed && <span className="announcements-count">
                    Showing latest ({displayedCount} item{displayedCount !== 1 ? "s" : ""})
                </span>}
                <NoticeBoardAnnouncementsFilter setImportanceFilter={setImportanceFilter} />
            </div>
            <div className="notice-board-announcements">
                <ul>{displayed?.map(announcement => <NoticeBoardAnnouncement announcement={announcement} />)}</ul>
                {displayedCount === 0 && <div className="empty-announcements">No matching announcements.</div>}
            </div>
            <CreateAnnouncement />
        </div>
    )
}