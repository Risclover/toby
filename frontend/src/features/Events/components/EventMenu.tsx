import { ActionIcon, Menu } from "@mantine/core";
import { IoEllipsisHorizontalSharp } from "react-icons/io5";
import DeleteRounded from '@mui/icons-material/Delete';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import type { CalendarEvent } from "@/store";

export const EventMenu = ({
    onDelete,
    setIsEditing,
    isEditing
}: {
    onDelete: () => void;
    setIsEditing: (val: boolean) => void; // fix the type
    isEditing: boolean;
}) => {
    return (
        <Menu offset={2}>
            <Menu.Target>
                <ActionIcon size="sm" variant="subtle" color="var(--mantine-color-gray-6)"><IoEllipsisHorizontalSharp /></ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Item onClick={() => setIsEditing(!isEditing)} leftSection={<BorderColorRoundedIcon fontSize="small" />}>{isEditing ? "Cancel edit" : "Edit"}</Menu.Item>
                <Menu.Item onClick={onDelete} color="red.9" leftSection={<DeleteRounded fontSize="small" />}>Delete</Menu.Item>
            </Menu.Dropdown>
        </Menu>
    )
}