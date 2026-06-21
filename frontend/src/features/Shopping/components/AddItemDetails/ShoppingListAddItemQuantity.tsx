import { NumberInput } from "@mantine/core"
import { useState, useEffect } from "react";

type Props = {
    quantity: number;
    onCommit: (q: number) => void;
    onClose: (finalValue?: number) => void;
}
export const ShoppingListAddItemQuantity = ({ quantity, onCommit, onClose }: Props) => {
    const [localValue, setLocalValue] = useState<number | "">(quantity);

    useEffect(() => {
        setLocalValue(quantity);
    }, [quantity]);

    const commitValue = () => {
        const resolved = localValue === "" ? 0 : localValue;
        onCommit(resolved);
        return resolved;
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const resolved = commitValue();
            onClose(resolved);
        }
        if (e.key === "Escape") {
            e.preventDefault();
            setLocalValue(quantity);
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
                onChange={(value) => setLocalValue(value === "" ? "" : Number(value))}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                    const resolved = commitValue();
                    onClose(resolved);
                }}
                styles={{
                    wrapper: {
                        display: "flex",
                        overflow: "hidden",
                        width: "100px",
                    },
                    input: {
                        minWidth: 0,
                        flex: 1
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