import React, { useState } from "react"
import { RegistrationPageOne } from "./RegistrationPageOne";
import { RegistrationPageTwo } from "./RegistrationPageTwo";
import { useCheckEmailMutation, useJoinHouseholdMutation, useSignupMutation } from "@/store/authSlice";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/Registration.css";

type Props = {
    createHousehold: boolean;
}

export const Registration = ({ createHousehold }: Props) => {
    const navigate = useNavigate();
    const [signup] = useSignupMutation();
    const [joinHousehold] = useJoinHouseholdMutation();
    const { inviteCode } = useParams();

    const [page, setPage] = useState(1);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");
    const [householdName, setHouseholdName] = useState("");
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState("");
    const [repeatPasswordError, setRepeatPasswordError] = useState("");
    const [nameError, setNameError] = useState("");

    const [checkEmail] = useCheckEmailMutation();

    const validateName = () => {
        if (name.trim().length === 0) {
            setNameError("Please enter your name.")
        } else {
            setNameError("");
        }
    }

    const validateEmail = async () => {
        const emailTaken = await checkEmail({ email })
        if (emailTaken.data?.Message) {
            setEmailError("Email already in use.")
        } else if (email.trim().length === 0) {
            setEmailError("Please enter your email address.")
        } else {
            setEmailError("")
        }
        return emailTaken.data?.Message;
    };

    const validatePassword = () => {
        if (password.length < 8) {
            setPasswordError("Password must be 8 characters or longer.")
        } else {
            setPasswordError("");
        }

        return passwordError;
    }

    const validateRepeatPassword = () => {
        if (repeatPassword.trim().length === 0 && password.trim().length >= 8) {
            setRepeatPasswordError("Please confirm your password.")
        } else if (password !== repeatPassword && password.trim().length > 0) {
            setRepeatPasswordError("Passwords don't match. Please try again.")
        } else {
            setRepeatPasswordError("");
        }

        return repeatPasswordError;
    }

    const inputProps = [
        {
            inputType: "text",
            inputName: "name",
            label: "What should we call you?",
            subLabel: "",
            placeholder: "e.g. Bob",
            inputValue: name,
            setInputValue: setName,
            error: nameError,
            onBlur: validateName
        },
        {
            inputType: "email",
            inputName: "email",
            label: "Your email",
            subLabel: "",
            placeholder: "bob@mail.com",
            inputValue: email,
            setInputValue: setEmail,
            error: emailError,
            onBlur: validateEmail
        },
        {
            inputType: "password",
            inputName: "password",
            label: "Password",
            subLabel: "Minimum 8 characters.",
            placeholder: "••••••••",
            inputValue: password,
            setInputValue: setPassword,
            error: passwordError,
            onBlur: validatePassword
        },
        {
            inputType: "password",
            inputName: "repeat-password",
            label: "Confirm Password",
            subLabel: "",
            placeholder: "••••••••",
            inputValue: repeatPassword,
            setInputValue: setRepeatPassword,
            error: repeatPasswordError,
            onBlur: validateRepeatPassword
        },
    ]

    const secondPageInputProps = [
        {
            inputType: "text",
            inputName: "household-name",
            label: "Household Name",
            subLabel: "",
            placeholder: "The Bob Family",
            inputValue: householdName,
            setInputValue: setHouseholdName
        }
    ]

    const handleContinue = async (e: React.FormEvent) => {
        validateEmail();
        validatePassword();
        validateRepeatPassword();
        validateName();

        if (nameError !== "" || emailError !== "" || passwordError !== "" || repeatPasswordError !== "") {
            return;
        } else {
            if (createHousehold) {
                setPage(2);
            } else {
                handleJoin(e);
            }
        }
    }

    const handleBack = () => {
        setPage(1);
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        await signup({ email, password, name, household_name: householdName });
        navigate("/");
        setEmail("");
        setName("");
        setPassword("");
        setRepeatPassword("");
        setHouseholdName("");
    }


    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        await joinHousehold({ email, name, password, inviteCode });
        navigate("/");
        setEmail("");
        setName("");
        setPassword("");
        setRepeatPassword("");
    }

    return (
        <div className="registration">
            {page === 1 && <RegistrationPageOne onClick={handleContinue} inputProps={inputProps} createHousehold={createHousehold} />}
            {page === 2 && <RegistrationPageTwo handleBack={handleBack} onClick={handleSignup} inputProps={secondPageInputProps} />}
        </div>
    )
}