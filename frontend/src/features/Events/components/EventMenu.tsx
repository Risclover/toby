import { ActionIcon, Menu } from "@mantine/core";
import { IoEllipsisHorizontalSharp } from "react-icons/io5";
import { FaTrash, FaSignOutAlt } from "react-icons/fa";
import { PencilIcon } from "@/assets/icons/PencilIcon";
import PersonRemoveRoundedIcon from '@mui/icons-material/PersonRemoveRounded';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import { useAuthenticateQuery, useUnassignSelfMutation, type CalendarEvent } from "@/store";

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
    thirdHandlers: { open: () => void; close: () => void };
}
export const EventMenu = ({
    setIsEditing,
    isEditing,
    occurrence,
    opened,
    open,
    close,
    secondOpened,
    secondHandlers,
    thirdHandlers
}: Props) => {
    const { data: currentUser } = useAuthenticateQuery();
    const [unassignSelf] = useUnassignSelfMutation();

    const handleDelete = () => {
        if (occurrence.recurringInstance?.isRecurringInstance) {
            open();
        } else {
            secondHandlers.open();
        }
    }

    const handleUnassignSelf = async () => {
        await unassignSelf({ id: Number(occurrence.payload?.source.id), householdId: Number(occurrence.payload?.source.householdId) }).unwrap();
    }

    return (
        <Menu offset={2}>
            <Menu.Target>
                <ActionIcon size="sm" variant="transparent" color="var(--mantine-color-gray-6)">
                    <IoEllipsisHorizontalSharp />
                </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                {occurrence && occurrence.payload?.source.attendeeIds.includes(currentUser.id) && <Menu.Item leftSection={<FaSignOutAlt fontSize=".9rem" />} onClick={thirdHandlers.open}>
                    Leave event
                </Menu.Item>}
                {occurrence && (occurrence.payload?.source.household.adminId === currentUser.id || occurrence.payload?.source.creatorId === currentUser.id) &&
                    <Menu.Item onClick={() => setIsEditing(!isEditing)} leftSection={<PencilIcon size=".9rem" color="var(--mantine-color-gray-8)" />}>{isEditing ? "Cancel edit" : "Edit"}</Menu.Item>}
                {occurrence && (occurrence.payload?.source.household.adminId === currentUser.id || occurrence.payload?.source.creatorId === currentUser.id) && <Menu.Item onClick={handleDelete} color="red" leftSection={<FaTrash fontSize=".9rem" />}>Delete</Menu.Item>}
            </Menu.Dropdown>
        </Menu>
    )
}