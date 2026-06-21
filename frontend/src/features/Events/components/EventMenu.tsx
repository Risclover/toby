import { ActionIcon, Menu } from "@mantine/core";
import { IoEllipsisHorizontalSharp } from "react-icons/io5";
import { FaTrash } from "react-icons/fa";
import { PencilIcon } from "@/assets/icons/PencilIcon";

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
                <ActionIcon size="sm" variant="subtle" color="var(--mantine-color-gray-6)">
                    <IoEllipsisHorizontalSharp />
                </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Item onClick={() => setIsEditing(!isEditing)} leftSection={<PencilIcon size="1rem" color="var(--mantine-color-gray-8)" />}>{isEditing ? "Cancel edit" : "Edit"}</Menu.Item>
                <Menu.Item onClick={onDelete} color="red.9" leftSection={<FaTrash fontSize="1rem" />}>Delete</Menu.Item>
            </Menu.Dropdown>
        </Menu>
    )
}