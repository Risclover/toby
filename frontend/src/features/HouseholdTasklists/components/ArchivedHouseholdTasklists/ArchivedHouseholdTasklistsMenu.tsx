import { ActionIcon, Button, Menu } from "@mantine/core"
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import RemoveRedEyeRoundedIcon from '@mui/icons-material/RemoveRedEyeRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import UnarchiveRoundedIcon from '@mui/icons-material/UnarchiveRounded';
import { ViewIcon } from "@/assets/icons/ViewIcon";
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import UnarchiveOutlinedIcon from '@mui/icons-material/UnarchiveOutlined';
import { UnarchivedIcon } from "@/assets/icons/UnarchivedIcon";
import { TrashIcon } from "@/assets/icons/TrashIcon";
import { MenuTrashIcon } from "@/assets/icons/MenuTrashIcon";
import { useUnarchiveListMutation } from "@/store/taskSlice";
import { useTasklistSettings } from "../../hooks/useTasklistSettings";
import { useNotifications } from "@mantine/notifications";
import { notifications } from '@mantine/notifications'; // <--- Import logic
import { useNavigate } from "react-router-dom";

type Props = {
    tasklistId: number;
}
export const ArchivedHouseholdTasklistsMenu = ({ tasklistId }: Props) => {
    const [unarchiveList] = useUnarchiveListMutation();
    const navigate = useNavigate();

    const handleUndoArchive = async () => {
        await unarchiveList({ listId: Number(tasklistId) }).unwrap();

        notifications.show({
            title: 'List unarchived successfully!',
            color: 'teal',
            position: 'bottom-center',
            autoClose: 5000, // Give them time to click
            message: (
                <Button variant="subtle" size="compact-xs" onClick={() => navigate(`/tasklists/${tasklistId}`)}>View tasklist</Button>
            )
        })
    }

    const handleView = () => {
        navigate(`/tasklists/${tasklistId}`)
    }

    return (
        <Menu
            loop={false}
            withinPortal={false}
            trapFocus={false}
            menuItemTabIndex={0} shadow="md" width={150}>
            <Menu.Target>
                <ActionIcon variant="subtle" color="rgb(5, 5, 73)" size='xs'><MoreVertRoundedIcon /></ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Item tabIndex={0} leftSection={<div className="archived-menu-icon"><ViewIcon /></div>} onClick={handleView}>View</Menu.Item>
                <Menu.Item leftSection={<div className="archived-menu-icon"><UnarchivedIcon /></div>} onClick={handleUndoArchive}>Restore</Menu.Item>
                <Menu.Item color="red.9" leftSection={<MenuTrashIcon />}>Delete</Menu.Item>
            </Menu.Dropdown>
        </Menu>
    )
}