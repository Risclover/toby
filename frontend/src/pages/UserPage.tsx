import { useParams } from "react-router-dom";
import { useCheckinMutation, useGetUserQuery } from "../store/userSlice";
import { useEffect, type MouseEvent } from "react";
import Profile from "../assets/profile.png"
import "./UserPage.css"
import { useGetHouseholdQuery } from "../store/householdSlice";
import { useAuthenticateQuery } from "../store/authSlice";
import { useCheckInTodayMutation, useGetUserCheckinsQuery } from "@/store/checkinSlice";

const toISO = (d: Date) => d.toISOString().slice(0, 10); // "YYYY-MM-DD"

export const UserPage = () => {
    const { userId } = useParams();

    const { data: currentUser } = useAuthenticateQuery();
    const { data: user } = useGetUserQuery(userId)
    const { data: household } = useGetHouseholdQuery(
        user?.householdId
    );
    const [checkin] = useCheckinMutation();

    useEffect(() => {
        console.log('user:', user);
    }, [user])

    const handleCheckin = async (e: MouseEvent) => {
        e.preventDefault();
        await checkin(userId);

    }
    const today = toISO(new Date());

    const { data, isFetching } = useGetUserCheckinsQuery(
        { userId: Number(userId)!, from: today, to: today },
        { skip: !userId }
    );
    const checkedInToday = !!data?.dates?.length;

    const [checkInToday, { isLoading: checkingIn }] = useCheckInTodayMutation();

    return (
        <div className="user-page">
            <img src={user?.profileImg} />
            <div><strong>Username:</strong> {user?.username}</div>
            <div><strong>Display Name:</strong> {user?.displayName}</div>
            <div><strong>Tagline:</strong> {user?.tagline}</div>
            <div><strong>Email:</strong> {user?.email}</div>
            <div><strong>Household:</strong> {household?.name}</div>
            <div><strong>Points:</strong> {user?.points}</div>
            <div><strong>Checked In?:</strong> {checkedInToday.toString()}</div>

            {currentUser?.id === user?.id && <button onClick={handleCheckin}>Check In</button>}
        </div>
    )
}

