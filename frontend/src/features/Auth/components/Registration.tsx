import React, { useState } from "react"
import { RegistrationPageOne } from "./RegistrationPageOne";
import { RegistrationPageTwo } from "./RegistrationPageTwo";
import { useCheckEmailMutation, useJoinHouseholdMutation, useSignupMutation, useValidateInviteQuery } from "@/store/authSlice";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/Registration.css";
import { InvalidInviteCode } from "./InvalidInviteCode";
import { Loader } from "@mantine/core";

type Props = {
    createHousehold: boolean;
};

export const Registration = ({ createHousehold }: Props) => {
    const navigate = useNavigate();
    const [signup] = useSignupMutation();
    const [joinHousehold] = useJoinHouseholdMutation();
    const { inviteCode } = useParams();

    const {
        isLoading: isInviteLoading,
        isFetching: isInviteFetching,
        isError: isInviteError,
        error: inviteError,
    } = useValidateInviteQuery(inviteCode as string, {
        skip: createHousehold || !inviteCode,
        refetchOnMountOrArgChange: true,
    });

    const [page, setPage] = useState(1);
    const [name, setName] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");
    const [householdName, setHouseholdName] = useState("");
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState("");
    const [repeatPasswordError, setRepeatPasswordError] = useState("");
    const [nameError, setNameError] = useState("");
    const [firstNameError, setFirstNameError] = useState("");
    const [lastNameError, setLastNameError] = useState("");

    const [checkEmail] = useCheckEmailMutation();

    const validateFirstName = () => {
        if (firstName.trim().length === 0) setFirstNameError("Please enter your first name.");
        else setFirstNameError("");
    }

    const validateLastName = () => {
        if (lastName.trim().length === 0) setLastNameError("Please enter your last name.");
        else setLastNameError("");
    }

    const validateEmail = async () => {
        const res: any = await checkEmail({ email });
        if (res?.data?.Message) setEmailError("Email already in use.");
        else if (email.trim().length === 0) setEmailError("Please enter your email address.");
        else setEmailError("");
        return res?.data?.Message;
    };

    const validatePassword = () => {
        if (password.length < 8) setPasswordError("Password must be 8 characters or longer.");
        else setPasswordError("");
        return passwordError;
    };

    const validateRepeatPassword = () => {
        if (repeatPassword.trim().length === 0 && password.trim().length >= 8) {
            setRepeatPasswordError("Please confirm your password.");
        } else if (password !== repeatPassword && password.trim().length > 0) {
            setRepeatPasswordError("Passwords don't match. Please try again.");
        } else {
            setRepeatPasswordError("");
        }
        return repeatPasswordError;
    };

    const inputProps = [
        {
            inputType: "text",
            inputName: "first",
            subLabel: "First name",
            placeholder: "e.g. Bob",
            inputValue: firstName,
            setInputValue: setFirstName,
            error: firstNameError,
            onBlur: validateFirstName,
        },
        {
            inputType: "text",
            inputName: "last",
            label: "",
            subLabel: "Last name",
            placeholder: "e.g. Smith",
            inputValue: lastName,
            setInputValue: setLastName,
            error: lastNameError,
            onBlur: validateLastName,
        },
        {
            inputType: "email",
            inputName: "email",
            label: "Email",
            subLabel: "",
            placeholder: "bob@mail.com",
            inputValue: email,
            setInputValue: setEmail,
            error: emailError,
            onBlur: validateEmail,
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
            onBlur: validatePassword,
        },
    ];

    const secondPageInputProps = [
        {
            inputType: "text",
            inputName: "household-name",
            label: "Household Name",
            subLabel: "",
            placeholder: "The Bob Family",
            inputValue: householdName,
            setInputValue: setHouseholdName,
        },
    ];

    const handleContinue = async (e: React.FormEvent) => {
        await validateEmail();
        validatePassword();
        validateRepeatPassword();
        validateFirstName();
        validateLastName();

        if (firstNameError || lastNameError || emailError || passwordError || repeatPasswordError) return;

        if (createHousehold) setPage(2);
        else handleJoin(e);
    };

    const handleBack = () => setPage(1);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        await signup({ email, password, firstName, lastName, household_name: householdName });
        navigate("/");
        setEmail("");
        setFirstName("");
        setLastName("");
        setPassword("");
        setRepeatPassword("");
        setHouseholdName("");
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        const res: any = await joinHousehold({ email, firstName, lastName, password, inviteCode });
        if ("error" in res) {
            return;
        }
        navigate("/");
        setEmail("");
        setFirstName("");
        setLastName("");
        setPassword("");
        setRepeatPassword("");
    };

    if (!createHousehold && inviteCode) {
        if (isInviteLoading || isInviteFetching) {
            return <div className="reg-loader"><Loader color="cyan.5" /></div>;
        }

        if (isInviteError) {
            const status = (inviteError as any)?.status;
            if (status === 404) return <InvalidInviteCode />;
            return <p>Something went wrong. Please try again.</p>;
        }
    }
    // ----------------------------------------------------

    return (
        <div className="registration">
            {page === 1 && (
                <RegistrationPageOne
                    onClick={handleContinue}
                    inputProps={inputProps}
                    createHousehold={createHousehold}
                />
            )}
            {page === 2 && (
                <RegistrationPageTwo
                    handleBack={handleBack}
                    onClick={handleSignup}
                    inputProps={secondPageInputProps}
                />
            )}
        </div>
    );
};
