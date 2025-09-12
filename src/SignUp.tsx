import { useState } from "react";
import { useAuthenticateQuery, useGenerateInviteMutation, useLoginMutation, useLogoutMutation, useSignupMutation } from "./store/authSlice";
import { data } from "react-router-dom";

export const SignUp = () => {
    const [signup] = useSignupMutation();
    const [logout] = useLogoutMutation();

    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [householdName, setHouseholdName] = useState("");
    const { data: user, error, isSuccess } = useAuthenticateQuery(undefined);
    const [inviteCode, setInviteCode] = useState("");
    const [generateInvite] = useGenerateInviteMutation();

    const handleLogout = async () => {
        await logout();
        setEmail("");
        setUsername("");
        setPassword("");
    }

    console.log('user:', user)
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        await signup({ username, email, password, household_name: householdName });
        setEmail("");
        setUsername("");
        setPassword("");
        setHouseholdName("");
    }
    return (
        <>
            <h1>Sign Up</h1>
            <div className="card">
                <form className="form" onSubmit={handleSignup}>
                    <input type="email" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                    <input type="username" id="username" name="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
                    <input type="password" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
                    <input type="text" id="householdName" name="householdName" value={householdName} onChange={(e) => setHouseholdName(e.target.value)} placeholder="Household Name" />

                    <button type="submit">Submit</button>
                </form>
            </div>

        </>
    )
}