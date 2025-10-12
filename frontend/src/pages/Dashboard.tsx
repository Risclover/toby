import { useEffect, useState, type MouseEvent } from "react";
import { skipToken } from "@reduxjs/toolkit/query"; // ⬅️ add this
import { useAuthenticateQuery, useLogoutMutation } from "@/store/authSlice";
import { useGetHouseholdQuery, useGetHouseholdShoppingListsQuery } from "@/store/householdSlice";
import "../assets/styles/Dashboard.css";
import { Button, ButtonGroup, Flex } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { CreateAnnouncement } from "@/features/Announcements/components/CreateAnnouncement";
import { Announcements } from "@/features/Announcements/components/Announcements";
import { WeekStrip } from "@/features/Events/components/DashboardMiniCalendar";
import { UpcomingThisWeek } from "@/features/Events/components/UpcomingThisWeek";
import HouseholdCheckinsMini from "@/features/Checkins/components/HouseholdCheckinsMini";
import { CheckInButton } from "@/features/Checkins/components/CheckInButton";
import { InviteLink } from "@/component/InviteLink";
import { useGetUserMoodQuery } from "@/store/userSlice";
import { MemberMood } from "@/features/Mood/components/MemberMood";
import { Tooltip } from "primereact/tooltip";
import { SpeedDial } from "primereact/speeddial";
import { FaUserCheck, FaUserPlus } from "react-icons/fa";
import { BsJournalCheck } from "react-icons/bs";
import { MdNotificationsActive } from "react-icons/md";
import { RiMegaphoneFill } from "react-icons/ri";
import { FaClipboardList } from "react-icons/fa";
import { FaCalendarPlus } from "react-icons/fa6";
import { FaSackDollar } from "react-icons/fa6";
import { BsCashStack } from "react-icons/bs";
import { HiUserGroup } from "react-icons/hi2";
import { TbUsersPlus } from "react-icons/tb";
import { MdGroupAdd } from "react-icons/md";
import { AiOutlineUsergroupAdd } from "react-icons/ai";
import { FaUsers } from "react-icons/fa6";
import { PiUsersThreeFill } from "react-icons/pi";
import { LuNotebookPen } from "react-icons/lu";
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';


import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';
import { useCheckInTodayMutation, useGetUserCheckinsQuery } from "@/store/checkinSlice";


const toISO = (d: Date) => d.toISOString().slice(0, 10); // "YYYY-MM-DD"

export const Dashboard = () => {
    const navigate = useNavigate();
    const { data: user, isFetching: authFetching } = useAuthenticateQuery();
    const householdId = user?.householdId;
    const [logout] = useLogoutMutation()
    const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showAddEvent, setShowAddEvent] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [checkInToday, { isLoading: checkingIn }] = useCheckInTodayMutation();

    const { data: list } = useGetHouseholdShoppingListsQuery(householdId ?? skipToken);

    // Only run the query once we have an id
    const {
        data: household,
        isFetching: householdFetching,
        error,
    } = useGetHouseholdQuery(householdId ?? skipToken);

    useEffect(() => {
        console.log("user:", user);
    }, [user]);

    const handleSignIn = (e: MouseEvent) => {
        e.preventDefault();
        navigate("/login")
    }

    const handleLogout = async () => {
        await logout();
    }
    const today = toISO(new Date());
    const { data, isFetching } = useGetUserCheckinsQuery(
        { userId: user?.id!, from: today, to: today },
        { skip: !user?.id }
    );
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
            command: () => setShowAddEvent(true)
        },
    ]

    const handleCheckin = async () => {
        if (checkedInToday) {

        }
    }
    return (
        <div className="dashboard">
            <div className="dashboard-titlebar">
                <h1>{household?.name ?? (authFetching || householdFetching ? "…" : "")}</h1>
                <div className="dashboard-titlebar-right">
                    <Flex gap="xs" wrap="wrap" direction="row">
                        <Button color="cyan" onClick={() => setShowCreateAnnouncement(true)}>Add Announcement</Button>
                        <Button color="cyan" onClick={() => setShowInviteModal(true)}>Invite</Button>
                        <CheckInButton />
                        {!user?.email ? <Button variant="filled" color="cyan" onClick={handleSignIn}>Sign In</Button> : <Button variant="filled" color="cyan" onClick={handleLogout}>Log Out</Button>}
                    </Flex>
                </div>
            </div>
            <Announcements householdId={household?.id} />
            <div className="dashboard-grid">
                <section>
                    <h2>This week</h2>
                    <WeekStrip setShowAddEvent={setShowAddEvent} showAddEvent={showAddEvent} householdId={householdId} />
                </section>
                <section>
                    <h2>Upcoming</h2>
                    <UpcomingThisWeek householdId={householdId} />
                </section>
            </div>
            <HouseholdCheckinsMini members={household?.members} />
            {showCreateAnnouncement && <CreateAnnouncement opened={showCreateAnnouncement} close={() => setShowCreateAnnouncement(false)} />}
            {showInviteModal && <InviteLink opened={showInviteModal} close={() => setShowInviteModal(false)} />}
            <div className="dashboard-body">
                {error ? <p>Couldn’t load household.</p> : null}
            </div>
            <div className="household-moods">
                <h2>Moods:</h2>
                {household?.members.map((user) => <MemberMood member={user} />)}
            </div>
            <div>
                {list?.map((list) => <div>{list.title}</div>)}
            </div>
            <Tooltip target=".speeddial-bottom-right .p-speeddial-action" position="left" />
            <SpeedDial model={items} direction="up" className="speeddial-bottom-right right-10 bottom-10" buttonClassName="p-button-cyan" />
        </div>
    );
};