import { ActionIcon, Menu } from "@mantine/core"
import { IoEllipsisVerticalSharp } from "react-icons/io5";
import DeleteRounded from '@mui/icons-material/Delete';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import { PadlockIcon } from "@/assets/icons/PadlockIcon";
import { PadlockOpenIcon } from "@/assets/icons/PadlockOpenIcon";
import { useDeleteHabitMutation, useUpdateHabitMutation, type Habit } from "@/store";
import { useHabitModal } from "@/contexts";
import { notifications } from "@mantine/notifications";
import { FaTrash } from "react-icons/fa";
import { PencilIcon } from "@/assets/icons/PencilIcon";
export const HabitMenu = ({ habit, setShowDeleteConfirmation }: { habit: Habit, setShowDeleteConfirmation: (val: boolean) => void }) => {
    const [updateHabit] = useUpdateHabitMutation();
    const [deleteHabit] = useDeleteHabitMutation();
    const { openModal } = useHabitModal();

    return (
        <Menu>
            <Menu.Target>
                <ActionIcon
                    p={0}
                    h="auto"
                    size="xs"
                    variant="transparent"
                    color="gray.6"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <IoEllipsisVerticalSharp />
                </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Item
                    onClick={(e) => {
                        e.stopPropagation();
                        openModal({
                            id: habit.id,
                            name: habit.name,
                            description: habit.description,
                            color: habit.color,
                            isPrivate: habit.isPrivate,
                        });
                    }}
                    leftSection={<PencilIcon size="1rem" color="var(--mantine-color-gray-8)" />}
                >
                    Edit
                </Menu.Item>
                <Menu.Item
                    color="red.9"
                    leftSection={<FaTrash fontSize="1rem" />}
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirmation(true);
                    }}
                >
                    Delete
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    )
}