import type { SetStateAction } from "react";
import { RemainingChars } from "./RemainingChars";

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

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    }

    return (
        <div className="form-input-container">
            <label htmlFor={inputName}>
                {label}
                <span className="sub-label">{subLabel}</span>
            </label>
            <input
                type={inputType}
                id={inputName}
                name={inputName}
                placeholder={placeholder}
                value={inputValue}
                onChange={onInputChange}
                onBlur={onBlur}
                maxLength={maxLength}
            />
            <div className="form-input-foot">
                {error && error.length > 0 ? <span className="form-input-error">{error}</span> : <span></span>}
                {maxLength && <RemainingChars count={inputValue.length} max={maxLength} light={remainingCharsLight} />}
            </div>
        </div>
    )
}