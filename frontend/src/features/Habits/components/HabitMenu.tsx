import { ActionIcon, Menu } from "@mantine/core"
import { IoEllipsisVerticalSharp } from "react-icons/io5";
import DeleteRounded from '@mui/icons-material/Delete';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import { PadlockIcon } from "@/assets/icons/PadlockIcon";
import { PadlockOpenIcon } from "@/assets/icons/PadlockOpenIcon";
import { useUpdateHabitMutation, type Habit } from "@/store";
import { useHabitModal } from "@/contexts";

export const HabitMenu = ({ habit, isPrivate }: { habit: Habit, isPrivate: boolean }) => {
    const [updateHabit] = useUpdateHabitMutation();
    const { openModal } = useHabitModal();
    const togglePrivacy = async () => {
        await updateHabit({ habitId: habit.id, isPrivate: !isPrivate })
    }
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
                    leftSection={<BorderColorRoundedIcon fontSize="small" />}
                >
                    Edit
                </Menu.Item>
                <Menu.Item
                    color="red.9"
                    leftSection={<DeleteRounded fontSize="small" />}
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                >
                    Delete
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    )
}