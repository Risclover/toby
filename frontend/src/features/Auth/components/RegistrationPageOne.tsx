import { FormInput } from "@/components/FormInput"
import { useGoogleLoginMutation } from "@/store";
import { Button, Divider, PasswordInput, ScrollArea, Stack } from "@mantine/core";
import { useGoogleLogin, type TokenResponse } from "@react-oauth/google";
import { useEffect, useState, type SetStateAction } from "react"
import { Link, useNavigate } from "react-router-dom";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { ViewPasswordIcon } from "@/assets/icons/ViewPasswordIcon";
import { HidePasswordIcon } from "@/assets/icons/HidePasswordIcon";

type InputProps = {
    inputType: string;
    inputName: string;
    label?: string;
    subLabel: string;
    placeholder: string;
    inputValue: string;
    setInputValue: React.Dispatch<SetStateAction<string>>;
    error?: string | null;
    onBlur: () => void;
}

type Props = {
    onClick: (e: React.FormEvent) => void;
    inputProps: InputProps[];
    createHousehold: boolean;
    inviteCode?: string;  // add this
}

const VisibilityToggleIcon = ({ reveal }: { reveal: boolean }) =>
    reveal ? (
        <ViewPasswordIcon size="1rem" color="rgb(5, 5, 73)" />
    ) : (
        <HidePasswordIcon size="1rem" color="rgb(5, 5, 73)" />
    );

export const RegistrationPageOne = ({ onClick, inputProps, createHousehold, inviteCode }: Props) => {
    const { signin } = useGoogleAuth(inviteCode);  // pass it through


    return (
        <div className="registration-form">
            <h2>Sign Up</h2>
            <div className="registration-form-content">
                <GoogleSignInButton label="Sign up with Google" onClick={() => signin()} />
                <Divider label="or" labelPosition="center" my="xs" />
                <Stack gap="xs">
                    <span className="fake-input-label">What should we call you?</span>
                    {inputProps.map((props) =>
                        <FormInput
                            key={props.inputName}
                            inputType={props.inputType}
                            inputName={props.inputName}
                            label={props?.label}
                            subLabel={props.subLabel}
                            placeholder={props.placeholder}
                            inputValue={props.inputValue}
                            setInputValue={props.setInputValue}
                            error={props.error}
                            onBlur={props.onBlur}
                        />
                    )}
                </Stack>
            </div>
            <Button size="md" radius="xl" onClick={onClick} color="cyan">
                {createHousehold ? "Continue" : "Sign Up"}
            </Button>
            <div className="login-switch">Already have an account? Switch to <Link to="/login" className="login-link">Login</Link>.</div>
        </div>
    )
}