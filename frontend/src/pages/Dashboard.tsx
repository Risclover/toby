import { useEffect, useState, type MouseEvent } from "react";
import { skipToken } from "@reduxjs/toolkit/query"; // ⬅️ add this
import { useAuthenticateQuery, useLogoutMutation } from "@/store/authSlice";
import { useGetHouseholdQuery } from "@/store/householdSlice";
import "../assets/styles/Dashboard.css";
import { Button } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useCreateAnnouncementMutation } from "@/store/announcementSlice";
import { CreateAnnouncement } from "@/features/Announcements/components/CreateAnnouncement";
import { Announcements } from "@/features/Announcements/components/Announcements";
import { WeekStrip } from "@/features/Events/components/DashboardMiniCalendar";
import { UpcomingThisWeek } from "@/features/Events/components/UpcomingThisWeek";
import { useCheckInTodayMutation, useGetUserCheckinsQuery } from "@/store/checkinSlice";
import Checkins from "@/features/Checkins/components/Checkins";
import HouseholdCheckinsMini from "@/features/Checkins/components/HouseholdCheckinsMini";
import { CheckInButton } from "@/features/Checkins/components/CheckInButton";

export const Dashboard = () => {
    const navigate = useNavigate();
    const { data: user, isFetching: authFetching } = useAuthenticateQuery();
    const householdId = user?.householdId;
    const [logout] = useLogoutMutation()
    const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
    const [checkInToday] = useCheckInTodayMutation()
    const { data: checkins } = useGetUserCheckinsQuery({ userId: user?.id })

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

    const handleCheckin = async () => {
        await checkInToday({ userId: user?.id })
    }

    console.log('checkins:', checkins)

    return (
        <div className="dashboard">
            <div className="dashboard-titlebar">
                <h1>{household?.name ?? (authFetching || householdFetching ? "…" : "")}</h1>
                <div className="dashboard-titlebar-right">
                    <input type="search" name="search" id="search" placeholder="Search" />
                    <Button variant="light" color="violet">Bell</Button>
                    <Button variant="light" color="violet">Gear</Button>
                    {!user?.email ? <Button variant="filled" color="violet" onClick={handleSignIn}>Sign In</Button> : <Button variant="filled" color="violet" onClick={handleLogout}>Log Out</Button>}
                    <Button color="violet" onClick={() => setShowCreateAnnouncement(true)}>Add Announcement</Button>
                    <CheckInButton />
                </div>
            </div>
            <Announcements householdId={household?.id} />
            <div className="dashboard-grid">
                <section>
                    <h2>This week</h2>
                    <WeekStrip householdId={householdId} />
                </section>
                <section>
                    <h2>Upcoming</h2>
                    <UpcomingThisWeek householdId={householdId} />
                </section>
            </div>
            <HouseholdCheckinsMini members={household?.members} />
            {showCreateAnnouncement && <CreateAnnouncement opened={showCreateAnnouncement} close={() => setShowCreateAnnouncement(false)} />}
            <div className="dashboard-body">
                {error ? <p>Couldn’t load household.</p> : null}
            </div>
        </div>
    );
};