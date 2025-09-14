import { useEffect } from "react";
import { skipToken } from "@reduxjs/toolkit/query"; // ⬅️ add this
import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdQuery } from "@/store/householdSlice";
import "../assets/styles/Dashboard.css";
import { Button } from "@mantine/core";
import { useNavigate } from "react-router-dom";

export const Dashboard = () => {
    const navigate = useNavigate();
    const { data: user, isFetching: authFetching } = useAuthenticateQuery();
    const householdId = user?.householdId;

    // Only run the query once we have an id
    const {
        data: household,
        isFetching: householdFetching,
        error,
    } = useGetHouseholdQuery(householdId ?? skipToken);

    useEffect(() => {
        console.log("user:", user);
    }, [user]);

    const handleClick = (e) => {
        e.preventDefault();
        navigate("/login")
    }

    return (
        <div className="dashboard">
            <div className="dashboard-titlebar">
                <h1>{household?.name ?? (authFetching || householdFetching ? "…" : "")}</h1>
                <div className="dashboard-titlebar-right">
                    <input type="search" name="search" id="search" placeholder="Search" />
                    <Button variant="light" color="violet">Bell</Button>
                    <Button variant="light" color="violet">Gear</Button>
                    <Button variant="filled" color="violet" onClick={handleClick}>Sign In</Button>
                </div>
            </div>
            <div className="dashboard-body">
                {error ? <p>Couldn’t load household.</p> : null}
            </div>
        </div>
    );
};