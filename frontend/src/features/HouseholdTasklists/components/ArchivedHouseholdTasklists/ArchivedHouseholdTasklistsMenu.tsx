import { useNavigate } from "react-router-dom";
import { ActionIcon, Button, Menu } from "@mantine/core"
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import { ViewIcon } from "@/assets/icons/ViewIcon";
import { UnarchivedIcon } from "@/assets/icons/UnarchivedIcon";
import { MenuTrashIcon } from "@/assets/icons/MenuTrashIcon";
import { useUnarchiveListMutation } from "@/store/taskSlice";
import { notifications } from '@mantine/notifications';

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