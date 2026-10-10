import { ActionIcon, Menu } from "@mantine/core";
import { FaSignOutAlt, FaTrash } from "react-icons/fa";
import { IoEllipsisHorizontalSharp } from "react-icons/io5";

import { PencilIcon } from "@/assets/icons/PencilIcon";

const MENU_OFFSET = 2;
const ITEM_ICON_SIZE = ".9rem";
const TRIGGER_COLOR = "var(--mantine-color-gray-6)";
const PENCIL_COLOR = "var(--mantine-color-gray-8)";

type EventMenuProps = {
    canEdit: boolean;
    canLeave: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onLeave: () => void;
};

export const EventMenu = ({ canEdit, canLeave, onEdit, onDelete, onLeave }: EventMenuProps) => (
    <Menu offset={MENU_OFFSET}>
        <Menu.Target>
            <ActionIcon size="sm" variant="transparent" color={TRIGGER_COLOR}>
                <IoEllipsisHorizontalSharp />
            </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
            {canLeave && (
                <Menu.Item leftSection={<FaSignOutAlt fontSize={ITEM_ICON_SIZE} />} onClick={onLeave}>
                    Leave event
                </Menu.Item>
            )}
            {canEdit && (
                <>
                    <Menu.Item
                        leftSection={<PencilIcon size={ITEM_ICON_SIZE} color={PENCIL_COLOR} />}
                        onClick={onEdit}
                    >
                        Edit
                    </Menu.Item>
                    <Menu.Item
                        color="red"
                        leftSection={<FaTrash fontSize={ITEM_ICON_SIZE} />}
                        onClick={onDelete}
                    >
                        Delete
                    </Menu.Item>
                </>
            )}
        </Menu.Dropdown>
    </Menu>
);