import { ActionIcon, Menu } from "@mantine/core";
import { IoEllipsisVerticalSharp } from "react-icons/io5";
import DeleteRounded from '@mui/icons-material/Delete';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';

export const EventMenu = () => {
    return (
        <Menu offset={2}>
            <Menu.Target>
                <ActionIcon variant="transparent" color="var(--mantine-color-gray-6)"><IoEllipsisVerticalSharp /></ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Item leftSection={<BorderColorRoundedIcon fontSize="small" />}>Edit</Menu.Item>
                <Menu.Item color="red.9" leftSection={<DeleteRounded fontSize="small" />}>Delete</Menu.Item>
            </Menu.Dropdown >
        </Menu>
    )
}