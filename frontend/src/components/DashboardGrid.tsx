import { DashboardMiniCalendar } from "@/features/Events/components/DashboardMiniCalendar";
import { UpcomingThisWeek } from "@/features/Events/components/UpcomingThisWeek";
import Sidebar from "@/layout/Sidebar";
import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdQuery, useGetHouseholdShoppingListsQuery } from "@/store/householdSlice";
import { skipToken } from "@reduxjs/toolkit/query";
import { useState } from "react";
import { DashboardHeader } from "./DashboardHeader";
import HouseholdCheckinsMini from "@/features/Checkins/components/HouseholdCheckinsMini";
import { SpeedDial } from "primereact/speeddial";
import { MdNotificationsActive } from "react-icons/md";
import { RiMegaphoneFill } from "react-icons/ri";
import { FaCalendarPlus } from "react-icons/fa6";
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import { useCheckInTodayMutation, useGetUserCheckinsQuery } from "@/store/checkinSlice";
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';
import { Tooltip } from "primereact/tooltip";

const toISO = (d: Date) => d.toISOString().slice(0, 10); // "YYYY-MM-DD"

export function DashboardGrid() {
    const today = toISO(new Date());
    const { data: user, isFetching: authFetching } = useAuthenticateQuery();
    const { data: list } = useGetHouseholdShoppingListsQuery(user?.householdId ?? skipToken);
    const { data, isFetching } = useGetUserCheckinsQuery(
        { userId: user?.id!, from: today, to: today },
        { skip: !user?.id }
    );
    const [showAddEvent, setShowAddEvent] = useState(false);
    const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [checkInToday, { isLoading: checkingIn }] = useCheckInTodayMutation();
    const [sidebarExpanded, setSidebarExpanded] = useState(() => {
        try { return localStorage.getItem("sidebar-collapsed") === "1"; }
        catch { return false; }
    });
    const {
        data: household,
        isFetching: householdFetching,
        error,
    } = useGetHouseholdQuery(user?.householdId ?? skipToken);
    const checkedInToday = !!data?.dates?.length;
    let items = [
        {
            label: "Check In",
            icon: <HowToRegRoundedIcon />,
            className: checkedInToday ? "my-action p-disabled" : "",
            command: () => checkInToday({ userId: user.id }).unwrap(),
        },
        {
            label: "Invite Member",
            icon: <GroupAddRoundedIcon />,
            command: () => setShowInviteModal(true)
        },
        {
            label: "+ Reminder",
            icon: <MdNotificationsActive />,
            command: () => console.log("Reminders")
        },
        {
            label: "+ Announcement",
            icon: <RiMegaphoneFill />,
            command: () => setShowCreateAnnouncement(true)
        },
        {
            label: "+ Event",
            icon: <FaCalendarPlus />,
            command: () => setShowAddEvent(true),
            pt: {
                action: {
                    "data-test": "quickadd-open"
                }
            }
        },
    ]
    return (
        <div className="dashboard-grid-container" data-layout={!sidebarExpanded ? "expanded" : "collapsed"}>
            {/* Sidebar (hidden on tablet/mobile) */}
            {/* <aside className="sidebar">
                <Sidebar setSidebarExpanded={setSidebarExpanded} sidebarExpanded={sidebarExpanded} />
            </aside> */}

            <div className="dashboard-grid">
                {/* Row 1 */}
                {/* <div className="dash-grid-item item-1">
                    <DashboardHeader
                        user={user}
                        household={household}
                        authFetching={authFetching}
                        householdFetching={householdFetching}
                    />
                </div> */}

                {/* Row 2 */}
                <div className="dash-grid-item item-2"><HouseholdCheckinsMini members={household?.members} /></div>
                <div className="dash-grid-item item-3"><HouseholdCheckinsMini members={household?.members} /></div>
                <div className="dash-grid-item item-4">
                    <DashboardMiniCalendar householdId={user?.householdId} showAddEvent={showAddEvent} setShowAddEvent={setShowAddEvent} />
                    <UpcomingThisWeek householdId={user?.householdId} />
                </div>

                {/* Row 3 */}
                <div className="dash-grid-item item-5"><HouseholdCheckinsMini members={household?.members} /></div>
                <div className="dash-grid-item item-6"><HouseholdCheckinsMini members={household?.members} /></div>

                {/* Row 4 */}
                <div className="dash-grid-item item-7"><HouseholdCheckinsMini members={household?.members} /></div>
                <div className="dash-grid-item item-8"><HouseholdCheckinsMini members={household?.members} /></div>
                <div className="dash-grid-item item-9"><HouseholdCheckinsMini members={household?.members} /></div>
            </div>
            <Tooltip target=".speeddial-bottom-right .p-speeddial-action" position="left" />
            <SpeedDial model={items} direction="up" className="speeddial-bottom-right right-10 bottom-10" buttonClassName="p-button-cyan" />
        </div>
    )
}
