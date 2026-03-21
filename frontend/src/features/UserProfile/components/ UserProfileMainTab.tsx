import { Tabs } from "@mantine/core"
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import { TbFlameFilled } from "react-icons/tb";
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
export const UserProfileMainTab = () => {
    return (
        <Tabs.Panel value="profile" className="user-profile-main-container">
            <div className="user-profile-stats">
                <div className="user-profile-stat">
                    <span className="user-profile-stat-icon"><CalendarMonthRoundedIcon /></span>
                    <span className="user-profile-stat-num">7 days</span>
                    <span className="user-profile-stat-title">longest check-in streak</span>
                </div>
                <div className="user-profile-stat">
                    <span className="user-profile-stat-icon"><HowToRegRoundedIcon /></span>
                    <span className="user-profile-stat-num">92%</span>
                    <span className="user-profile-stat-title">total check-ins</span>
                </div>
                <div className="user-profile-stat">
                    <span className="user-profile-stat-icon"><AssignmentTurnedInRoundedIcon /></span>
                    <span className="user-profile-stat-num">492</span>
                    <span className="user-profile-stat-title">tasks completed</span>
                </div>
                <div className="user-profile-stat">
                    <span className="user-profile-stat-icon"><TbFlameFilled /></span>
                    <span className="user-profile-stat-num">6 days</span>
                    <span className="user-profile-stat-title">best habit streak</span>
                </div>
            </div>
        </Tabs.Panel>
    )
}