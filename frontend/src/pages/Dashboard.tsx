import { useEffect, useState, type MouseEvent } from "react";
import { skipToken } from "@reduxjs/toolkit/query"; // ⬅️ add this
import { useAuthenticateQuery, useLogoutMutation } from "@/store/authSlice";
import { useGetHouseholdQuery, useGetHouseholdShoppingListsQuery } from "@/store/householdSlice";
import "../assets/styles/Dashboard.css";
import { Button, Flex } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { CreateAnnouncement } from "@/features/Announcements/components/CreateAnnouncement";
import { Announcements } from "@/features/Announcements/components/Announcements";
import { DashboardMiniCalendar } from "@/features/Events/components/DashboardMiniCalendar";
import { UpcomingThisWeek } from "@/features/Events/components/UpcomingThisWeek";
import HouseholdCheckinsMini from "@/features/Checkins/components/HouseholdCheckinsMini";
import { CheckInButton } from "@/features/Checkins/components/CheckInButton";
import { InviteLink } from "@/component/InviteLink";
import { MemberMood } from "@/features/Mood/components/MemberMood";
import { Tooltip } from "primereact/tooltip";
import { SpeedDial } from "primereact/speeddial";
import { MdNotificationsActive } from "react-icons/md";
import { RiMegaphoneFill } from "react-icons/ri";
import { FaCalendarPlus } from "react-icons/fa6";
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
            command: () => setShowAddEvent(true),
            pt: {
                action: {
                    "data-test": "quickadd-open"
                }
            }
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
            <div className="dashboard-grid dashboard-events">
                <section>
                    <DashboardMiniCalendar setShowAddEvent={setShowAddEvent} showAddEvent={showAddEvent} householdId={householdId} />
                </section>
                <section>
                    <UpcomingThisWeek householdId={householdId} />
                </section>
            </div>
            <HouseholdCheckinsMini members={household?.members} />
            <CreateAnnouncement opened={showCreateAnnouncement} close={() => setShowCreateAnnouncement(false)} />
            <InviteLink opened={showInviteModal} close={() => setShowInviteModal(false)} />
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