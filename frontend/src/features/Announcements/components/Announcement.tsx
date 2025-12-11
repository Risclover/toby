import { formatAnnouncementTimestamp } from "../utils/formatAnnouncementTimestamp";
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import { Button } from "@mantine/core";
import { IoEllipsisVerticalSharp } from "react-icons/io5";


type Props = {
    creator: {
        name: string;
        profileImg: string;
    };
    announcement: {
        message: string;
        createdAt?: string | null | undefined;
        isImportant: boolean;
    };
}

export const Announcement = ({ creator, announcement }: Props) => {
    return (
        <div className={`single-announcement${announcement.isImportant ? " important-announcement" : ""}`}>
            <div className="single-announcement-header">
                <div className="single-announcement-header-left">
                    <img src={creator.profileImg} />
                    <div className="single-announcement-header-info">
                        <span className="single-announcement-creator">{creator.name}</span>
                        <span className="single-announcement-timestamp">{(() => {
                            const ts = formatAnnouncementTimestamp(announcement.createdAt ?? null);
                            return typeof ts === "string" ? ts : `${ts.day} · ${ts.time}`;
                        })()}</span>
                    </div>
                </div>
                <div className="single-announcement-header-right">
                    {announcement.isImportant && <div className="single-announcement-importance-label">
                        <WarningAmberRoundedIcon /> Important
                    </div>}
                    <button className="announcement-menu-btn"><IoEllipsisVerticalSharp /></button>
                </div>
            </div>

            {announcement.message}
        </div>
    )
}