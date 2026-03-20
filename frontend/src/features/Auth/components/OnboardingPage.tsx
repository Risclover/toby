import { useState } from "react";
import { Button, Stack, TextInput, Tabs, Alert } from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
import { useCreateHouseholdMutation, useJoinExistingHouseholdMutation } from "@/store";
import { IoArrowBackOutline } from "react-icons/io5";
import { FormInput } from "@/components";
import { RemainingChars } from "@/components/RemainingChars";

export const OnboardingPage = () => {
    const navigate = useNavigate();
    const [householdName, setHouseholdName] = useState('');
    const [householdError, setHouseholdError] = useState("")
    const [inviteCode, setInviteCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [createHousehold, { isLoading: isCreating }] = useCreateHouseholdMutation();
    const [joinHousehold, { isLoading: isJoining }] = useJoinExistingHouseholdMutation();

    const handleCreate = async () => {
        if (!householdName.trim()) return setHouseholdError('Household name is required.');
        try {
            setHouseholdError("");
            await createHousehold({ household_name: householdName }).unwrap();
            navigate('/dashboard');
        } catch {
            setError('Failed to create household. Please try again.');
        }
    };

    const validateHouseholdName = () => {
        if (householdName.trim().length === 0) setHouseholdError("Please enter a name for your household.");
        else setHouseholdError("");
    }

    return (
        <div className="registration">
            <div className="registration-form">
                <h2>Household Creation</h2>
                <div className="registration-form-content">
                    <FormInput
                        inputType="text"
                        inputName="household"
                        label="Household name"
                        subLabel="You can change your household name at any time."
                        placeholder="E.g. The Sara Family"
                        inputValue={householdName}
                        setInputValue={setHouseholdName}
                        error={householdError}
                        onBlur={validateHouseholdName}
                        maxLength={50}
                        remainingCharsLight={true}
                    />
                </div>
                <Button role="submit" size="md" radius="xl" style={{ margin: "0 auto", marginTop: "1rem" }} color="cyan">Sign Up</Button>
            </div>
        </div>
    );
};