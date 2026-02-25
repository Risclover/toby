import { useDeleteManualReminderMutation, type Reminder } from "@/store/reminderSlice";
import dayjs from "dayjs";
import { getReminderTime } from "../utils/getReminderTime";
import { Avatar, Tooltip, UnstyledButton } from "@mantine/core";
import type { User } from "@/store";
import { TobyIcon } from "@/assets";
type Props = {
    reminderId: number;
    reminder: Reminder;
}

export const NoticeBoardReminder = ({ reminder }: Props) => {
    return (
        <li className="notice-board-reminder">
            <div className="notice-board-reminder-main">
                <div className="notice-board-reminder-body">{reminder.message}</div>
                <div className="notice-board-reminder-details">
                    {!reminder.isAutomatic && <div className="notice-board-reminder-details-people">
                        <Tooltip label={`Created by ${reminder.createdBy?.firstName}`}>
                            <Avatar size={16} src={reminder.createdBy?.profileImg} radius="xl" />
                        </Tooltip>

                        <span>→</span>
                        {reminder.assignedTo && reminder.assignedTo.length > 0 ? (
                            <div> {/* Negative gap for overlap effect */}
                                <Avatar.Group spacing="0.5rem">
                                    {reminder.assignedTo.map((assignee: User) => (
                                        <Tooltip key={assignee.id} label={assignee.firstName}>
                                            <Avatar
                                                size={20}
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
                    <span className="reminder-system">{reminder.isAutomatic && reminder.sourceEntityType === "task" ? (
                        <Tooltip label="Created by Toby">
                            <Avatar size={20} variant="transparent"><TobyIcon size="1rem" color="var(--mantine-color-dark-4)" /></Avatar>
                        </Tooltip>
                    ) : ""}</span>


                    <span className="reminder-ago">Posted: {getReminderTime(reminder.createdAt)}</span>
                </div>
            </div>
        </li>
    )
}
