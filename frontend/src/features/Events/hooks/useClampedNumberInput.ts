import { useCallback } from "react";

/**
 * Wraps a NumberInput's value/onChange/onBlur so an emptied field (Mantine
 * reports this as `""`, not a number) resets to a sane default on blur
 * instead of staying blank. Shared by every "Repeat every [n]"-shaped input.
 */
export function useClampedNumberInput(
    value: number | string,
    setValue: (value: number | string) => void,
    defaultValue: number
) {
    const onBlur = useCallback(() => {
        if (typeof value === "string") setValue(defaultValue);
    }, [value, setValue, defaultValue]);

    return { value, onChange: setValue, onBlur };
}