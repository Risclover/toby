import { DashboardMiniCalendar } from "@/features/Events/components/DashboardMiniCalendar";
import { UpcomingThisWeek } from "@/features/Events/components/UpcomingThisWeek";
import Sidebar from "@/layout/Sidebar";
import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdQuery, useGetHouseholdShoppingListsQuery } from "@/store/householdSlice";
import { skipToken } from "@reduxjs/toolkit/query";
import { useState } from "react";
import HouseholdCheckinsMini from "@/features/Checkins/components/HouseholdCheckinsMini";
import { SpeedDial } from "primereact/speeddial";
import { MdNotificationsActive } from "react-icons/md";
import { RiMegaphoneFill } from "react-icons/ri";
import { FaCalendarPlus } from "react-icons/fa6";
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import { useCheckInTodayMutation, useGetUserCheckinsQuery } from "@/store/checkinSlice";
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';
import { DashboardHeader } from "@/component/DashboardHeader";
import { DashboardGrid } from "@/component/DashboardGrid";
import { InviteLink } from "@/component/InviteLink";


const toISO = (d: Date) => d.toISOString().slice(0, 10); // "YYYY-MM-DD"

export const Dashboard = () => {
    const today = toISO(new Date());
    const { data: user, isFetching: authFetching } = useAuthenticateQuery();
    const { data, isFetching } = useGetUserCheckinsQuery(
        { userId: user?.id!, from: today, to: today },
        { skip: !user?.id }
    );
    const {
        data: household,
        isFetching: householdFetching,
        error,
    } = useGetHouseholdQuery(user?.householdId ?? skipToken);
    const [checkInToday, { isLoading: checkingIn }] = useCheckInTodayMutation();

    const [showAddEvent, setShowAddEvent] = useState(false);
    const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
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
        <div className="dashboard-page">
            <header>
                <DashboardHeader
                    user={user}
                    household={household}
                    authFetching={authFetching}
                    householdFetching={householdFetching}
                />
            </header>
            <DashboardGrid />
            <SpeedDial model={items} direction="up" className="speeddial-bottom-right right-10 bottom-10" buttonClassName="p-button-cyan" />
            <InviteLink opened={showInviteModal} close={() => setShowInviteModal(false)} />
        </div>
    )
}

// export const Dashboard = () => {
//     const navigate = useNavigate();
//     const { data: user, isFetching: authFetching } = useAuthenticateQuery();
//     const householdId = user?.householdId;
//     const [logout] = useLogoutMutation()
//     const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
//     const [showInviteModal, setShowInviteModal] = useState(false);
//     const [showAddEvent, setShowAddEvent] = useState(false);
//     const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
//     const [checkInToday, { isLoading: checkingIn }] = useCheckInTodayMutation();

//     const { data: list } = useGetHouseholdShoppingListsQuery(householdId ?? skipToken);

//     // Only run the query once we have an id
//     const {
//         data: household,
//         isFetching: householdFetching,
//         error,
//     } = useGetHouseholdQuery(householdId ?? skipToken);

//     useEffect(() => {
//         console.log("user:", user);
//     }, [user]);

//     const handleSignIn = (e: MouseEvent) => {
//         e.preventDefault();
//         navigate("/login")
//     }

//     const handleLogout = async () => {
//         await logout();
//     }
//     const today = toISO(new Date());
//     const { data, isFetching } = useGetUserCheckinsQuery(
//         { userId: user?.id!, from: today, to: today },
//         { skip: !user?.id }
//     );
//     const checkedInToday = !!data?.dates?.length;
//     let items = [
//         {
//             label: "Check In",
//             icon: <HowToRegRoundedIcon />,
//             className: checkedInToday ? "my-action p-disabled" : "",
//             command: () => checkInToday({ userId: user.id }).unwrap(),
//         },
//         {
//             label: "Invite Member",
//             icon: <GroupAddRoundedIcon />,
//             command: () => setShowInviteModal(true)
//         },
//         {
//             label: "+ Reminder",
//             icon: <MdNotificationsActive />,
//             command: () => console.log("Reminders")
//         },
//         {
//             label: "+ Announcement",
//             icon: <RiMegaphoneFill />,
//             command: () => setShowCreateAnnouncement(true)
//         },
//         {
//             label: "+ Event",
//             icon: <FaCalendarPlus />,
//             command: () => setShowAddEvent(true),
//             pt: {
//                 action: {
//                     "data-test": "quickadd-open"
//                 }
//             }
//         },
//     ]

//     const handleCheckin = async () => {
//         if (checkedInToday) {

//         }
//     }
//     return (
//         <div className="dashboard">
//             <DashboardGrid />
//             <div className="dashboard-titlebar">
//                 <h1>{household?.name ?? (authFetching || householdFetching ? "…" : "")}</h1>
//                 <div className="dashboard-titlebar-right">
//                     <Flex gap="xs" wrap="wrap" direction="row">
//                         <Button color="cyan" onClick={() => setShowCreateAnnouncement(true)}>Add Announcement</Button>
//                         <Button color="cyan" onClick={() => setShowInviteModal(true)}>Invite</Button>
//                         <CheckInButton />
//                         {!user?.email ? <Button variant="filled" color="cyan" onClick={handleSignIn}>Sign In</Button> : <Button variant="filled" color="cyan" onClick={handleLogout}>Log Out</Button>}
//                     </Flex>
//                 </div>
//             </div>
//             <Announcements householdId={household?.id} />
//             <div className="dashboard-grid dashboard-events">
//                 <section>
//                     <DashboardMiniCalendar setShowAddEvent={setShowAddEvent} showAddEvent={showAddEvent} householdId={householdId} />
//                 </section>
//                 <section>
//                     <UpcomingThisWeek householdId={householdId} />
//                 </section>
//             </div>
//             <HouseholdCheckinsMini members={household?.members} />
//             <CreateAnnouncement opened={showCreateAnnouncement} close={() => setShowCreateAnnouncement(false)} />
//             <InviteLink opened={showInviteModal} close={() => setShowInviteModal(false)} />
//             <div className="dashboard-body">
//                 {error ? <p>Couldn’t load household.</p> : null}
//             </div>
//             <div className="household-moods">
//                 <h2>Moods:</h2>
//                 {household?.members.map((user) => <MemberMood member={user} />)}
//             </div>
//             <div>
//                 {list?.map((list) => <div>{list.title}</div>)}
//             </div>
//             <Tooltip target=".speeddial-bottom-right .p-speeddial-action" position="left" />
//             <SpeedDial model={items} direction="up" className="speeddial-bottom-right right-10 bottom-10" buttonClassName="p-button-cyan" />
//         </div>
//     );
// };