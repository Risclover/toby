import { useLogoutMutation, type User } from '@/store/authSlice';
import type { Household } from '@/store/householdSlice'
import { Button, Flex } from '@mantine/core';
import React, { type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom';
import "../assets/styles/Dashboard.css";

type Props = {
    user: User;
    household: Household;
    authFetching: boolean;
    householdFetching: boolean;
}

export function DashboardHeader({ user, household, authFetching, householdFetching }: Props) {
    const navigate = useNavigate();
    const [logout] = useLogoutMutation()

    const handleSignIn = (e: MouseEvent) => {
        e.preventDefault();
        navigate("/login")
    }

    const handleLogout = async () => {
        await logout();
    }
    return (
        <div className="dashboard-header">
            <h1>{household?.name ?? (authFetching || householdFetching ? "…" : "")}</h1>
            <div className="dashboard-titlebar-right">
                <Flex gap="xs" wrap="wrap" direction="row">
                    {!user?.email ? <Button variant="filled" color="cyan" onClick={handleSignIn}>Sign In</Button> : <Button variant="filled" color="cyan" onClick={handleLogout}>Log Out</Button>}
                </Flex>
            </div>
        </div>
    )
}
