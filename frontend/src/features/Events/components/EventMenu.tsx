import { ActionIcon, Menu } from "@mantine/core";
import { IoEllipsisHorizontalSharp } from "react-icons/io5";
import { FaTrash } from "react-icons/fa";
import { PencilIcon } from "@/assets/icons/PencilIcon";

import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import type { CalendarEvent } from "@/store";
import type { Occurrence } from "../types";

type Props = {
    occurrence: Occurrence;
    setIsEditing: (val: boolean) => void; // fix the type
    isEditing: boolean;
    opened: boolean;
    open: () => void;
    close: () => void;
    secondOpened: boolean;
    secondHandlers: { open: () => void; close: () => void };
}
export const EventMenu = ({
    setIsEditing,
    isEditing,
    occurrence,
    opened,
    open,
    close,
    secondOpened,
    secondHandlers
}: Props) => {
    const handleDelete = () => {
        if (occurrence.recurringInstance?.isRecurringInstance) {
            open();
        } else {
            secondHandlers.open();
        }
    }
    return (
        <Menu offset={2}>
            <Menu.Target>
                <ActionIcon size="sm" variant="transparent" color="var(--mantine-color-gray-6)">
                    <IoEllipsisHorizontalSharp />
                </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Item onClick={() => setIsEditing(!isEditing)} leftSection={<PencilIcon size="1rem" color="var(--mantine-color-gray-8)" />}>{isEditing ? "Cancel edit" : "Edit"}</Menu.Item>
                <Menu.Item onClick={handleDelete} color="red" leftSection={<FaTrash fontSize="1rem" />}>Delete</Menu.Item>
            </Menu.Dropdown>
        </Menu>
    )
}