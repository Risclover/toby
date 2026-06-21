import { NumberInput } from "@mantine/core"
import { useState, useEffect } from "react";

type Props = {
    quantity: number;
    onCommit: (q: number) => void;
    onClose: (finalValue?: number) => void;
}
export const ShoppingListAddItemQuantity = ({ quantity, onCommit, onClose }: Props) => {
    const [localValue, setLocalValue] = useState(quantity);

    useEffect(() => {
        setLocalValue(quantity);
    }, [quantity]);

    const handleChange = (value: number | string) => {
        const next = Number(value);
        setLocalValue(next);
        onCommit(next); // push to draft on every keystroke now
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            onClose(localValue);
        }
        if (e.key === "Escape") {
            e.preventDefault();
            setLocalValue(quantity);
            onCommit(quantity); // also revert the draft, not just local display
            onClose();
        }
    };

    return (
        <div className="shopping-list-add-item-detail--popover">
            <NumberInput
                stepHoldDelay={500}
                stepHoldInterval={100}
                allowNegative={false}
                value={localValue}
                max={9999}
                clampBehavior="strict"
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                styles={{
                    wrapper: {
                        display: "flex",
                        overflow: "hidden",
                        width: "100px",
                    },
                    input: {
                        minWidth: 0,
                        flex: 1,
                    },
                    controls: {
                        borderRadius: 0,
                        flexShrink: 0,
                    },
                }}
            />
        </div>
    )
}