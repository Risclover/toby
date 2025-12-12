import { formatAnnouncementTimestamp } from "../utils/formatAnnouncementTimestamp";
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import { Button } from "@mantine/core";
import { IoEllipsisVerticalSharp } from "react-icons/io5";
import { AnnouncementMenu } from "./AnnouncementMenu";
import { useRef, useState } from "react";
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
};

export const Announcement = ({ creator, announcement, isMenuOpen, onToggleMenu, onCloseMenu }: Props) => {
    const wrapperRef = useRef(null);
    const [showAnnouncementMenu, setShowAnnouncementMenu] = useState(false);

    useOutsideClick(wrapperRef, () => onCloseMenu(), isMenuOpen);

    console.log("announcement:", announcement);

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
                    <button data-outside-ignore className="announcement-menu-btn" onClick={onToggleMenu}>
                        <IoEllipsisVerticalSharp />
                    </button>
                </div>
                {isMenuOpen && <AnnouncementMenu ref={wrapperRef} announcement={announcement} />}
            </div>

            {announcement.message}
        </div>
    )
}