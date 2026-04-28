import { ActionIcon, Menu } from "@mantine/core"
import { IoEllipsisVerticalSharp } from "react-icons/io5";
import DeleteRounded from '@mui/icons-material/Delete';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import { PadlockIcon } from "@/assets/icons/PadlockIcon";
import { PadlockOpenIcon } from "@/assets/icons/PadlockOpenIcon";
import { useDeleteHabitMutation, useUpdateHabitMutation, type Habit, type PersonalNote } from "@/store";
import { useHabitModal } from "@/contexts";
import { notifications } from "@mantine/notifications";
import { usePersonalNoteModal } from "@/contexts/PersonalNoteModalContext";

export const PersonalNoteMenu = ({ note, setShowDeleteConfirmation }: { note: PersonalNote, setShowDeleteConfirmation: (val: boolean) => void }) => {
    const { openModal } = usePersonalNoteModal();

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
                            id: note.id,
                            title: note.title,
                            body: note.body,
                            categoryId: note.categoryId,
                            isPrivate: note.isPrivate
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
                        setShowDeleteConfirmation(true);
                    }}
                >
                    Delete
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    )
}