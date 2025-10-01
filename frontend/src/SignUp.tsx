import { useState } from "react";
import { useCheckEmailMutation, useSignupMutation } from "./store/authSlice";
import { useNavigate } from "react-router-dom";

export const SignUp = () => {
    const navigate = useNavigate();
    const [signup] = useSignupMutation();

    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [householdName, setHouseholdName] = useState("");
    const [emailError, setEmailError] = useState<string | null>(null);
    const [usernameError, setUsernameError] = useState<string | null>(null);

    const [checkEmail] = useCheckEmailMutation();

    const validateEmail = async () => {
        const emailTaken = await checkEmail({ email })
        if (emailTaken.data?.Message) {
            setEmailError("Email already in use")
        } else {
            setEmailError("")
        }

        return emailTaken.data?.Message;
    };


    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        const emailInUse = await validateEmail();

        if (emailInUse) return;

        await signup({ email, password, name, household_name: householdName });
        navigate("/");
        setEmail("");
        setName("");
        setPassword("");
        setHouseholdName("");

    }

    return (
        <>
            <h1>Sign Up</h1>
            <div className="card">
                <form className="form" onSubmit={handleSignup}>
                    <input type="email" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                    {emailError}
                    <input type="username" id="username" name="username" value={name} onChange={(e) => setName(e.target.value)} placeholder="Username" />
                    {usernameError}
                    <input type="password" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
                    <input type="text" id="householdName" name="householdName" value={householdName} onChange={(e) => setHouseholdName(e.target.value)} placeholder="Household Name" />

                    <button type="submit">Submit</button>
                </form>
            </div>

        </>
    )
}