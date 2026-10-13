import { Tabs } from "@mantine/core"
import { TbFlameFilled } from "react-icons/tb";
import StickyNote2RoundedIcon from '@mui/icons-material/StickyNote2Rounded';
import PersonIcon from '@mui/icons-material/Person';
import { UserProfileMainTab } from "./UserProfileMainTab";

export const UserProfileNavGrid = () => {
    return (
        <Tabs.List grow className="all-reminders-tabs-list">
            <Tabs.Tab pt=".75rem" pb=".5rem" value="profile" color="navy" leftSection={<PersonIcon fontSize="small" />}>Profile</Tabs.Tab>
            <Tabs.Tab pt=".75rem" pb=".5rem" value="habits" color="navy" leftSection={<TbFlameFilled size="20px" />}>Habits</Tabs.Tab>
            <Tabs.Tab pt=".75rem" pb=".5rem" value="notes" color="navy" leftSection={<StickyNote2RoundedIcon fontSize="small" />}>Notes</Tabs.Tab>
        </Tabs.List>
    )
}