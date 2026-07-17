import { useState, useEffect, useRef } from "react";

type Props = {
    /** Quantity value to initialize/reset the local input from. */
    quantity: number;
    /** Called with the resolved number whenever the value changes or is committed. */
    onCommit: (q: number) => void;
    /** Called when the popover should close; passed the resolved value, or the snapshot on discard. */
    onClose: (finalValue?: number) => void;
}

/**
 * Manages the quantity popover's local input value and its commit/discard
 * behavior: typing commits immediately, Enter commits and closes, Escape
 * discards back to the last-known `quantity` and closes, and blurring
 * commits whatever is currently typed.
 */
export const useShoppingListAddItemQuantity = ({ quantity, onCommit, onClose }: Props) => {
    // Refs
    const isDiscardingRef = useRef(false);

    // State
    const [localValue, setLocalValue] = useState<number | "">(quantity);

    // Other hooks
    useEffect(() => {
        setLocalValue(quantity);
    }, [quantity]);

    // Handlers
    const commitValue = () => {
        const resolved = localValue === "" ? 0 : localValue;
        onCommit(resolved);
        return resolved;
    };

    const handleChange = (value: number | string) => {
        setLocalValue(value === "" ? "" : Number(value));
        if (value !== "") {
            onCommit(Number(value));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const resolved = commitValue();
            onClose(resolved);
        }
        if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation(); // prevent Mantine's FocusTrap from also handling Escape
            isDiscardingRef.current = true;
            setLocalValue(quantity);
            onClose(quantity); // pass snapshot back as explicit finalValue — signals discard
        }
    };

    const handleBlur = () => {
        if (isDiscardingRef.current) {
            isDiscardingRef.current = false;
            return;
        }
        const resolved = commitValue();
        onClose(resolved);
    };

    return { localValue, handleChange, handleKeyDown, handleBlur };
};