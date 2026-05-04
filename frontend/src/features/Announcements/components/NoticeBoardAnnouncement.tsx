import { useRef } from "react";
import { Link } from "react-router-dom";
import { Avatar, Badge, Text } from "@mantine/core";
import { DeleteConfirmation } from "@/components";
import { AnnouncementMenu } from "./AnnouncementMenu";
import { useAnnouncement } from "../hooks/useAnnouncement";
import { useAuthenticateQuery, type Announcement } from "@/store"
import { StarIcon } from "@/assets";
import { useHousehold } from "@/hooks/useHousehold";

type Props = {
    announcement: Announcement;
}

export const NoticeBoardAnnouncement = ({ announcement }: Props) => {
    const triggerRef = useRef<HTMLButtonElement>(null);

    const { data: user } = useAuthenticateQuery();
    const { message, creator, isImportant, seenByCurrent } = announcement;
    const { data: household } = useHousehold();

    const {
        setOpenDeleteConfirmation,
        openDeleteConfirmation,
        handleDeleteAnnouncement,
        formattedTimestamp
    } = useAnnouncement({ announcement, user, triggerRef })

    return (
        <li className="notice-board-announcement">
            <div className={`single-announcement${isImportant ? " important-announcement" : ""}`}>
                <div className="single-announcement-header">
                    {/* Creator avatar and name, creation timestamp */}
                    <div className="single-announcement-header-left">
                        <Avatar component={Link} to={`/profile/${creator?.id}`} target="_blank" src={creator?.profileImg} radius="xl" size={20} />
                        <div className="single-announcement-header-info">
                            <Link target="_blank" to={`/profile/${creator?.id}`} className="single-announcement-creator">{creator?.firstName}</Link>
                            <span className="single-announcement-timestamp">
                                {formattedTimestamp
                                    ? `${formattedTimestamp.day} · ${formattedTimestamp.time}`
                                    : ""
                                }
                            </span>
                        </div>
                    </div>
                    {/* 'New' badge, star icon, and announcement menu */}
                    <div className="single-announcement-header-right">
                        {!announcement.seenByCurrent && (
                            <div className="single-announcement-new-label">
                                <Badge variant="light" color="red" size="sm">New</Badge>
                            </div>
                        )}
                        {announcement?.isImportant && (
                            <div className="single-announcement-importance-label">
                                <StarIcon color="rgb(230, 176, 2)" size="18px" />
                            </div>
                        )}
                        {((household?.adminId === user.id) || (user.id === creator?.id)) && (
                            <AnnouncementMenu
                                ref={triggerRef}
                                announcement={announcement}
                                setOpenDeleteConfirmation={setOpenDeleteConfirmation}
                            />
                        )}
                    </div>
                </div>
                {/* Announcement text */}
                <Text
                    c="black"
                    size="xs"
                    className={`announcement-message${!seenByCurrent ? " new-announcement" : ""}`}
                >
                    {message}
                </Text>
            </div>
            {/* Delete announcement confirmation */}
            {openDeleteConfirmation && (
                <DeleteConfirmation
                    itemType="announcement"
                    modalTitle="Confirm delete announcement"
                    opened={openDeleteConfirmation}
                    setShowDeleteConfirmation={setOpenDeleteConfirmation}
                    handleDeleteItem={handleDeleteAnnouncement}
                    triggerRef={triggerRef}
                />
            )}
        </li>
    )
}