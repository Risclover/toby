import type { SetStateAction } from "react";

type Props = {
    inputName: string;
    label: string;
    subLabel?: string | undefined;
    inputType: string;
    placeholder: string;
    inputValue: string;
    setInputValue: React.Dispatch<SetStateAction<string>>;
    error?: string | null;
    onBlur?: () => void;
}

export const FormInput = ({ inputName, label, subLabel, inputType, placeholder, inputValue, setInputValue, error = null, onBlur }: Props) => {

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    }

    console.log('error:', error)
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
            />
            {error && error.length > 0 && <span className="form-input-error">{error}</span>}
        </div>
    )
}