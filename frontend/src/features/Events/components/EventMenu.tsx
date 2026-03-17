import { ActionIcon, Menu } from "@mantine/core";
import { IoEllipsisHorizontalSharp } from "react-icons/io5";
import DeleteRounded from '@mui/icons-material/Delete';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';

export const EventMenu = ({
    onDelete,
    setIsEditing,
    isEditing
}: {
    onDelete: () => void;
    setIsEditing: (val: boolean) => void;
    isEditing: boolean;
}) => {
    const handleEditClick = () => {
        setIsEditing(true);
    }

    return (
        <Menu offset={2}>
            <Menu.Target>
                <ActionIcon size="sm" variant="subtle" color="var(--mantine-color-gray-6)"><IoEllipsisHorizontalSharp /></ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                {isEditing
                    ? <Menu.Item onClick={() => setIsEditing(false)} leftSection={<BorderColorRoundedIcon fontSize="small" />}>Cancel edit</Menu.Item>
                    : <Menu.Item onClick={() => setIsEditing(true)} leftSection={<BorderColorRoundedIcon fontSize="small" />}>Edit</Menu.Item>
                }
                <Menu.Item onClick={onDelete} color="red.9" leftSection={<DeleteRounded fontSize="small" />}>Delete</Menu.Item>
            </Menu.Dropdown >
        </Menu>
    )
}