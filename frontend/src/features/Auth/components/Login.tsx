import { FormInput } from "@/component/FormInput"
import { useLoginMutation } from "@/store/authSlice";
import { Button, ScrollArea, Stack } from "@mantine/core"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom";

export const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [formError, setFormError] = useState("");

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
        const data = await login({ email: email, password: password });
        console.log('data:', data);
        const errors = data?.error?.data?.errors;

        if (errors && errors.length > 0) {
            setFormError(errors[0]);
        } else {
            navigate("/");
        }
    }

    return (
        <div className="registration">
            <div className="registration-form">
                <h2>Log In</h2>
                <ScrollArea h={160} offsetScrollbars overscrollBehavior="contain" style={{ paddingLeft: "1rem" }}>
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
                </ScrollArea>
                <Button style={{ flexShrink: 0 }} size="md" radius="md" color="cyan" onClick={handleLogin}>Log In</Button>
                <div className="login-switch">Need an account? Switch to <Link className="login-link" to="/signup">Sign Up</Link>.</div>
            </div>
        </div>
    )
}