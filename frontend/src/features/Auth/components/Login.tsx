import { FormInput } from "@/components/FormInput"
import { useGoogleLoginMutation, useLoginMutation } from "@/store/authSlice";
import { Button, Divider, ScrollArea, Stack } from "@mantine/core"
import { useGoogleLogin, type TokenResponse } from "@react-oauth/google";
import { useEffect, useState, type MouseEvent } from "react"
import { Link, useNavigate } from "react-router-dom";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { GoogleSignInButton } from "./GoogleSignInButton";

export const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [formError, setFormError] = useState("");

    const { signin } = useGoogleAuth();
    const [login] = useLoginMutation();

    const validateEmail = () => {
        if (email.trim().length === 0) setEmailError("Please enter your email address.");
        else setEmailError("");
    }

    const validatePassword = () => {
        if (password.trim().length === 0) setPasswordError("Please enter your password.");
        else setPasswordError("");
    }

    const inputProps = [{
        inputType: "email",
        inputName: "email",
        label: "Your email",
        placeholder: "bob@mail.com",
        inputValue: email,
        setInputValue: setEmail,
        error: emailError,
    },
    {
        inputType: "password",
        inputName: "password",
        label: "Password",
        placeholder: "••••••••",
        inputValue: password,
        setInputValue: setPassword,
        error: passwordError,
    }]

    const handleLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        const emailEmpty = email.trim().length === 0;
        const passwordEmpty = password.trim().length === 0;

        setEmailError(emailEmpty ? "Please enter your email address." : "");
        setPasswordError(passwordEmpty ? "Please enter your password." : "");

        if (emailEmpty || passwordEmpty) return;

        try {
            await login({ email, password }).unwrap();
            navigate("/");
        } catch (err: any) {
            const errors = err?.data?.errors;
            if (errors && errors.length > 0) {
                setPasswordError(errors[0]);
            }
        }
    }


    return (
        <div className="registration">
            <div className="registration-form">
                <h2>Log In</h2>
                <div className="registration-form-content">
                    <GoogleSignInButton onClick={() => signin()} />
                    <Divider label="or" labelPosition="center" my="xs" />
                    <Stack gap="xs">
                        {inputProps.map((props) =>
                            <FormInput
                                inputType={props.inputType}
                                inputName={props.inputName}
                                label={props.label}
                                placeholder={props.placeholder}
                                inputValue={props.inputValue}
                                setInputValue={props.setInputValue}
                                error={props.error}
                            />)}
                    </Stack>
                </div>
                <Button type="button" style={{ flexShrink: 0 }} size="md" radius="md" color="cyan" onClick={handleLogin}>Log In</Button>
                <div className="login-switch">Need an account? Switch to <Link className="login-link" to="/signup">Sign Up</Link>.</div>
            </div>
        </div>
    )
}