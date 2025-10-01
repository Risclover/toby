import { FormInput } from "@/component/FormInput"
import { Button, ScrollArea, Stack } from "@mantine/core";
import { type SetStateAction } from "react"
import { Link } from "react-router-dom";

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
    onClick: (e: React.FormEvent) => void;
    inputProps: InputProps[];
    createHousehold: boolean;
}

export const RegistrationPageOne = ({ onClick, inputProps, createHousehold }: Props) => {
    return (
        <div className="registration-form">
            <h2>Sign Up</h2>
            <ScrollArea h={390} offsetScrollbars overscrollBehavior="contain" style={{ paddingLeft: "1rem" }}>
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
            <Button size="md" radius="xl" onClick={onClick} color="cyan">{createHousehold ? "Continue" : "Sign Up"}</Button>
            <div className="login-switch">Already have an account? Switch to <Link to="/login" className="login-link">Login</Link>.</div>
        </div>
    )
}