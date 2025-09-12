import type React from "react";
import { useAuthenticateQuery, useJoinHouseholdMutation, useLogoutMutation } from "./store/authSlice";
import { useEffect, useState } from "react";
import { data, useParams, useNavigate } from "react-router-dom";
import { useGetHouseholdQuery } from "./store/householdSlice";
import { skipToken } from "@reduxjs/toolkit/query";


export const Join = () => {
    const [joinHousehold] = useJoinHouseholdMutation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [householdName, setHouseholdName] = useState("");
    const { inviteCode } = useParams();
    const { data: user } = useAuthenticateQuery();
    const [logout] = useLogoutMutation();
    const navigate = useNavigate();

    const { data: household } = useGetHouseholdQuery(
        user ? user?.householdId : skipToken
    );

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data } = await joinHousehold({ email, username, password, inviteCode });
        setEmail("");
        setUsername("");
        setPassword("");
        if (data) setHouseholdName(data.household.name)
    }

    const handleLogout = async (e: React.MouseEvent) => {
        e.preventDefault();
        await logout();
        navigate("/");
    }
    useEffect(() => {
        console.log('user:', user);
        console.log('household:', household)
    }, [user, household])
    return (
        <>
            {!user?.errors && <div>You are part of the household {household?.name}. <button onClick={handleLogout}>Log Out</button></div>}
            {user?.errors && <form onSubmit={handleJoin}>
                <input type="email" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                <input type="username" id="username" name="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
                <input type="password" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />                <button type="submit">Submit</button>
            </form>}
        </>
    )
}

