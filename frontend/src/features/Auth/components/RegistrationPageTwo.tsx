import { FormInput } from "@/component/FormInput";
import { Button } from "@mantine/core";
import React, { type SetStateAction } from "react"
import KeyboardBackspaceRoundedIcon from '@mui/icons-material/KeyboardBackspaceRounded';
import { IoArrowBackOutline } from "react-icons/io5";


type InputProps = {
    inputType: string;
    inputName: string;
    label: string;
    subLabel: string;
    placeholder: string;
    inputValue: string;
    setInputValue: React.Dispatch<SetStateAction<string>>;
}

type Props = {
    handleBack: () => void;
    onClick: (e: React.FormEvent) => void;
    inputProps: InputProps[];
}

export const RegistrationPageTwo = ({ handleBack, inputProps, onClick }: Props) => {
    return (
        <div className="registration-form reg-page-two">
            <span className="form-back-btn" onClick={handleBack}><IoArrowBackOutline />Back</span>
            <h2>Give your household a name</h2>
            <div className="registration-form-body">
                {inputProps.map((props) =>
                    <FormInput
                        inputType={props.inputType}
                        inputName={props.inputName}
                        label={props.label}
                        subLabel={props.subLabel}
                        placeholder={props.placeholder}
                        inputValue={props.inputValue}
                        setInputValue={props.setInputValue}
                    />
                )}
            </div>
            <Button role="submit" size="md" radius="xl" style={{ margin: "0 auto", marginTop: "1rem" }} color="cyan" onClick={onClick}>Sign Up</Button>
        </div>
    )
}