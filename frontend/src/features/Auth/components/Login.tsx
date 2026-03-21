import { FormInput } from "@/components/FormInput"
import { useGoogleLoginMutation, useLoginMutation } from "@/store/authSlice";
import { Button, Divider, ScrollArea, Stack } from "@mantine/core"
import { useGoogleLogin, type TokenResponse } from "@react-oauth/google";
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { GoogleSignInButton } from "./GoogleSignInButton";

export const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [formError, setFormError] = useState("");

    const { signin } = useGoogleAuth();
    const [login] = useLoginMutation();

    const inputProps = [{
        inputType: "email",
        inputName: "email",
        label: "Your email",
        placeholder: "bob@mail.com",
        inputValue: email,
        setInputValue: setEmail,
        error: null,
    },
    {
        inputType: "password",
        inputName: "password",
        label: "Password",
        placeholder: "••••••••",
        inputValue: password,
        setInputValue: setPassword,
        error: formError,
    }]

    const handleLogin = async () => {
        const result = await login({ email, password });
        if ('error' in result) {
            const error = result.error as { data?: { errors?: string[] } };
            const errors = error?.data?.errors;
            if (errors && errors.length > 0) {
                setFormError(errors[0]);
            }
        } else {
            navigate("/");
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
                <Button style={{ flexShrink: 0 }} size="md" radius="md" color="cyan" onClick={handleLogin}>Log In</Button>
                <div className="login-switch">Need an account? Switch to <Link className="login-link" to="/signup">Sign Up</Link>.</div>
            </div>
        </div>
    )
}