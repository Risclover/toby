import { TrashIcon } from "@/assets";
import { useDeleteManualReminderMutation, type ReminderType } from "@/store/reminderSlice";
import { Avatar, Button, Tooltip } from "@mantine/core"; // Added Tooltip for better UX
import "../styles/Reminder.css";
import { AlarmIcon } from "@/assets/icons/AlarmIcon";
import { EventIcon } from "@/assets/icons/EventIcon";
import { CheckCircleIcon } from "@/assets/icons/CheckCircleIcon";
import { NewsIcon } from "@/assets/icons/NewsIcon";
import { useAuthenticateQuery, useGetHouseholdQuery } from "@/store";

type Props = {
    reminderId: number;
    reminder: ReminderType;
}

export const Reminder = ({ reminderId, reminder }: Props) => {
    const { data: user } = useAuthenticateQuery();
    // You likely don't need household query if the reminder object has the data
    const [deleteReminder] = useDeleteManualReminderMutation();

    const handleDelete = async () => {
        const data = await deleteReminder(reminderId);
        console.log('data:', data)
    }

    let icon;
    let color;

    switch (reminder.reminderType) {
        case "task_due":
            color = "gold";
            icon = <AlarmIcon size="26px" color={color} />
            break;
        case "event_starting":
            color = "blue";
            icon = <EventIcon size="26px" color={color} />
            break;
        case "daily_check_in_missing":
            color = "green";
            icon = <CheckCircleIcon size="30px" color={color} />
            break;
        case "custom":
        default:
            color = "purple";
            icon = <NewsIcon size="28px" color={color} />
            break;
    }

    // REMOVED: const assignees = ... (Don't transform this into a string here)

    return (
        <div className={`reminder-item`} style={{ borderLeft: `4px solid ${color}` }}>
            <div className="reminder-main">
                <div className="reminder-header">
                    <div className="reminder-icon">{icon}</div>
                    <div className="reminder-title">
                        {reminder.title || "Custom reminder"}
                    </div>

                </div>
                <div className="reminder-body">
                    <div className="reminder-space"></div>
                    <div className="reminder-message">{reminder.body}</div>
                </div>
            </div>

            <div className="reminder-footer">
                {!reminder.isAutomatic && (
                    <div className="reminder-created-by" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Creator */}
                        <Tooltip label={`Created by ${reminder.createdBy?.firstName}`}>
                            <Avatar size={20} src={reminder.createdBy?.profileImg} radius="xl" />
                        </Tooltip>

                        <span>→</span>

                        {/* Assignees */}
                        {reminder.assignedTo && reminder.assignedTo.length > 0 ? (
                            <div> {/* Negative gap for overlap effect */}
                                <Avatar.Group spacing="sm">
                                    {reminder.assignedTo.map((assignee) => (
                                        <Tooltip key={assignee.id} label={assignee.firstName}>
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
                    </div>
                )}
            </div>
        </div>
    )
}
