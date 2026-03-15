import { useDeleteManualReminderMutation, type Reminder } from "@/store/reminderSlice";
import dayjs from "dayjs";
import { getReminderTime } from "../utils/getReminderTime";
import { Avatar, Badge, Box, Tooltip, UnstyledButton } from "@mantine/core";
import type { User } from "@/store";
import { TobyIcon } from "@/assets";
import relativeTime from "dayjs/plugin/relativeTime";
import { FaLongArrowAltRight } from "react-icons/fa";
import { MdOutlineArrowRightAlt } from "react-icons/md";
import { HiArrowLongRight } from "react-icons/hi2";
import { Link } from "react-router-dom";

dayjs.extend(relativeTime);

type Props = {
    reminder: Reminder;
}

export const NoticeBoardReminder = ({ reminder }: Props) => {
    const formatReminderDate = (triggerDate?: string, createdAt?: string): string => {
        if (triggerDate) {
            const today = new Date().toISOString().slice(0, 10);
            const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
            if (triggerDate === today) return "Today";
            if (triggerDate === yesterday) return "Yesterday";
            return new Date(triggerDate).toLocaleDateString(undefined, { month: "short", day: "numeric" });
        }
        // fall back to relative time from createdAt
        const normalized = createdAt?.endsWith("Z") ? createdAt : createdAt + "Z";
        const diff = Math.floor((Date.now() - new Date(normalized!).getTime()) / 1000);
        if (diff < 60) return "just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return new Date(normalized!).toLocaleDateString();
    };

    const listId = reminder.sourceEntityMetadata?.listId;

    return (
        <li className="notice-board-reminder">
            <div className="notice-board-reminder-main">
                <div className="notice-board-reminder-body">
                    {listId ? (
                        <Link
                            to={`/tasklists/${listId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="reminder-task-link"
                        >
                            {reminder.message}
                        </Link>
                    ) : (
                        reminder.message
                    )}
                    {reminder.currentUserAssignment && !reminder.currentUserAssignment.seen && (
                        <div className="reminder-badge">
                            <Badge size="xs" fw={600} variant="light" color="red">New</Badge>
                        </div>
                    )}

                </div>
                <div className="notice-board-reminder-footer">
                    {reminder.isAutomatic ?
                        <div className="notice-board-reminder-assigned">
                            <Tooltip label="Created by Toby" withArrow>
                                <Box><TobyIcon size="18px" color="var(--mantine-color-gray-8)" /></Box>
                            </Tooltip>
                        </div>
                        : <div className="notice-board-reminder-assigned">
                            <Tooltip withArrow label={`Created by ${reminder.createdBy?.firstName}`}>
                                <Avatar size={20} src={reminder.createdBy?.profileImg} radius="xl" />
                            </Tooltip>

                            <span className="reminder-relationship-arrow"><HiArrowLongRight />
                            </span>
                            {reminder.assignedTo && reminder.assignedTo.length > 0 ? (
                                <div>
                                    <Avatar.Group spacing="0.5rem">
                                        {reminder.assignedTo.map((assignee: User) => (
                                            <Tooltip withArrow key={assignee.id} label={assignee.firstName}>
                                                <Avatar
                                                    size={24}
                                                    src={assignee.profileImg}
                                                    radius="xl"
                                                />
                                            </Tooltip>
                                        ))}
                                    </Avatar.Group>
                                </div>
                            ) : (
                                <span style={{ fontSize: '0.85rem', color: '#666' }}>everyone</span>
                            )}
                        </div>}
                    <div className="reminder-separator-dot">·</div>
                    <div className="notice-board-reminder-details">
                        <div className="notice-board-reminder-timestamp">{formatReminderDate(reminder.triggerDate, reminder.createdAt)}</div>
                    </div>
                </div>
            </div>
        </li>
    )
}
