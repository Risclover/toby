import { formatAnnouncementTimestamp } from "../utils/formatAnnouncementTimestamp";
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

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
                {announcement.isImportant && <div className="single-announcement-importance-label">
                    <WarningAmberRoundedIcon /> Important
                </div>}
            </div>

            {announcement.message}
        </div>
    )
}