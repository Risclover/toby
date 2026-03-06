import { useDeleteManualReminderMutation, type Reminder } from "@/store/reminderSlice";
import dayjs from "dayjs";
import { getReminderTime } from "../utils/getReminderTime";
import { Avatar, Badge, Tooltip, UnstyledButton } from "@mantine/core";
import type { User } from "@/store";
import { TobyIcon } from "@/assets";
import relativeTime from "dayjs/plugin/relativeTime";
import { FaLongArrowAltRight } from "react-icons/fa";
import { MdOutlineArrowRightAlt } from "react-icons/md";
import { HiArrowLongRight } from "react-icons/hi2";

dayjs.extend(relativeTime);

type Props = {
    reminder: Reminder;
}

export const NoticeBoardReminder = ({ reminder }: Props) => {
    return (
        <li className="notice-board-reminder">
            <div className="notice-board-reminder-main">
                <div className="notice-board-reminder-body">
                    {reminder.message}
                    <div className="reminder-badge">
                        <Badge size="xs" fw={600} variant="light" color="red">New</Badge>
                    </div>

                </div>
                <div className="notice-board-reminder-footer">
                    {reminder.isAutomatic ?
                        <div className="notice-board-reminder-assigned">
                            <TobyIcon size="18px" color="var(--mantine-color-gray-8)" />
                        </div>
                        : <div className="notice-board-reminder-assigned">
                            <Tooltip label={`Created by ${reminder.createdBy?.firstName}`}>
                                <Avatar size={18} src={reminder.createdBy?.profileImg} radius="xl" />
                            </Tooltip>

                            <span className="reminder-relationship-arrow"><HiArrowLongRight />
                            </span>
                            {reminder.assignedTo && reminder.assignedTo.length > 0 ? (
                                <div>
                                    <Avatar.Group spacing="0.5rem">
                                        {reminder.assignedTo.map((assignee: User) => (
                                            <Tooltip key={assignee.id} label={assignee.firstName}>
                                                <Avatar
                                                    size={22}
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
                        <div className="notice-board-reminder-timestamp">{dayjs(reminder.createdAt).fromNow()}</div>
                    </div>
                </div>
            </div>
        </li>
    )
}
