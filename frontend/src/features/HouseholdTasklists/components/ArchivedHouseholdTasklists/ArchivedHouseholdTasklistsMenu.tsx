import { ActionIcon, Menu } from "@mantine/core"
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
export const ArchivedHouseholdTasklistsMenu = () => {
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
                <Menu.Item tabIndex={0} leftSection={<div className="archived-menu-icon"><ViewIcon /></div>}>View</Menu.Item>
                <Menu.Item leftSection={<div className="archived-menu-icon"><UnarchivedIcon /></div>}>Restore</Menu.Item>
                <Menu.Item color="red.9" leftSection={<MenuTrashIcon />}>Delete</Menu.Item>
            </Menu.Dropdown>
        </Menu>
    )
}