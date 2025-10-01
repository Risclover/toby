import { FormInput } from "@/component/FormInput"
import { Button, ScrollArea, Stack } from "@mantine/core";
import { useState, type SetStateAction } from "react"

type InputProps = {
    inputType: string;
    inputName: string;
    label: string;
    subLabel: string;
    placeholder: string;
    inputValue: string;
    setInputValue: React.Dispatch<SetStateAction<string>>;
    error?: string | null;
    onBlur: () => void;
}

type Props = {
    onClick: () => void;
    inputProps: InputProps[];
    createHousehold: boolean;
}

export const RegistrationPageOne = ({ onClick, inputProps, createHousehold }: Props) => {
    return (
        <div className="registration-form">
            <h2>Sign Up</h2>
            <ScrollArea h={390} offsetScrollbars overscrollBehavior="contain">
                <Stack gap="xs">
                    {inputProps.map((props) =>
                        <FormInput
                            inputType={props.inputType}
                            inputName={props.inputName}
                            label={props.label}
                            subLabel={props.subLabel}
                            placeholder={props.placeholder}
                            inputValue={props.inputValue}
                            setInputValue={props.setInputValue}
                            error={props.error}
                            onBlur={props.onBlur}
                        />
                    )}
                </Stack>
            </ScrollArea>
            <Button style={{ flexShrink: 0 }} size="md" radius="md" onClick={onClick} color="cyan">{createHousehold ? "Continue" : "Sign Up"}</Button>
            <div className="login-switch">Already have an account? Switch to <span className="login-link">Login</span></div>
        </div>
    )
}