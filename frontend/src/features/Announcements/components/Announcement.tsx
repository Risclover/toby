import { formatAnnouncementTimestamp } from "../utils/formatAnnouncementTimestamp";
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { IoEllipsisVerticalSharp } from "react-icons/io5";
import { AnnouncementMenu } from "./AnnouncementMenu";
import { useRef, useState } from "react";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { Link } from "react-router-dom";
import { useAuthenticateQuery } from "@/store/authSlice";
import { AnnouncementDeleteConfirmation } from "./AnnouncementDeleteConfirmation";
import { Avatar } from "@mantine/core";
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import Brightness1RoundedIcon from '@mui/icons-material/Brightness1Rounded';

type Props = {
    creator: {
        id: number;
        firstName: string;
        profileImg: string;
    };
    announcement: {
        id: number;
        householdId: number;
        message: string;
        createdAt?: string | null | undefined;
        isImportant: boolean;
        seenByCurrent?: boolean | undefined;
    };
    isMenuOpen: boolean;
    onToggleMenu: () => void;
    onCloseMenu: () => void;
};

export const Announcement = ({ creator, announcement, isMenuOpen, onToggleMenu, onCloseMenu }: Props) => {
    const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const { data: user } = useAuthenticateQuery();
    useOutsideClick(wrapperRef, () => onCloseMenu(), isMenuOpen);

    return (
        <div className={`single-announcement${announcement?.isImportant ? " important-announcement" : ""}`}>
            <div className="single-announcement-header">
                <div className="single-announcement-header-left">
                    <Avatar component={Link} to={`/users/${creator?.id}`} target="_blank" src={creator?.profileImg} radius="xl" size="sm" />
                    <div className="single-announcement-header-info">
                        <Link target="_blank" to={`/users/${creator?.id}`} className="single-announcement-creator">{creator?.firstName}</Link>
                        <span className="single-announcement-timestamp">{(() => {
                            const ts = formatAnnouncementTimestamp(announcement.createdAt ?? null);
                            return typeof ts === "string" ? ts : `${ts?.day} · ${ts?.time}`;
                        })()}</span>
                    </div>
                </div>
                <div className="single-announcement-header-right">
                    {announcement?.isImportant && <div className="single-announcement-importance-label">
                        <StarRoundedIcon />
                    </div>}
                    {!announcement.seenByCurrent && <div className="single-announcement-new-label"><Brightness1RoundedIcon /></div>}
                    {user.id === creator.id && <button data-outside-ignore className="announcement-menu-btn" onClick={onToggleMenu}>
                        <IoEllipsisVerticalSharp />
                    </button>}
                </div>
                {isMenuOpen && <AnnouncementMenu ref={wrapperRef} announcement={announcement} onCloseMenu={onCloseMenu} setOpenDeleteConfirmation={setOpenDeleteConfirmation} />}
                {openDeleteConfirmation && <AnnouncementDeleteConfirmation announcement={announcement} openDeleteConfirmation={openDeleteConfirmation} setOpenDeleteConfirmation={setOpenDeleteConfirmation} />}
            </div>

            <span className={`announcement-message${!announcement.seenByCurrent ? " new-announcement" : ""}`}>{announcement?.message}</span>
        </div>
    )
}