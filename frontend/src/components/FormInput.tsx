import { useState, type SetStateAction } from "react";
import { RemainingChars } from "./RemainingChars";
import { ViewPasswordIcon } from "@/assets/icons/ViewPasswordIcon";
import { HidePasswordIcon } from "@/assets/icons/HidePasswordIcon";

type Props = {
    inputName: string;
    label?: string;
    subLabel?: string | undefined;
    inputType: string;
    placeholder: string;
    inputValue: string;
    setInputValue: React.Dispatch<SetStateAction<string>>;
    error?: string | null;
    onBlur?: () => void;
    maxLength?: number;
    remainingCharsLight?: boolean;
}

export const FormInput = ({ inputName, label = "", subLabel = "", inputType, placeholder, inputValue, setInputValue, error = null, onBlur, maxLength, remainingCharsLight = false }: Props) => {
    const [showViewPassword, setShowViewPassword] = useState(false);

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    }

    return (
        <div className="form-input-container">
            <label htmlFor={inputName}>
                {label}
                <span className="sub-label">{subLabel}</span>
            </label>
            <div className="form-input">
                <input
                    type={inputType === "password" ? (showViewPassword ? "text" : "password") : inputType}
                    id={inputName}
                    name={inputName}
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={onInputChange}
                    onBlur={onBlur}
                    maxLength={maxLength}
                />
                {inputName === "password" && <div className="password-icon" onClick={() => setShowViewPassword(prev => !prev)}>{showViewPassword ? <ViewPasswordIcon size="1.25rem" color="white" /> : <HidePasswordIcon size="1.25rem" color="white" />}</div>}
            </div>
            <div className="form-input-foot">
                {error && error.length > 0 ? <span className="form-input-error">{error}</span> : <span></span>}
                {maxLength && <RemainingChars count={inputValue.length} max={maxLength} light={remainingCharsLight} />}
            </div>
        </div>
    )
}