import { NumberInput } from "@mantine/core";
import { useShoppingListAddItemQuantity } from "../../hooks/useShoppingListAddItemQuantity";

/** Props for ShoppingListAddItemQuantity. */
type Props = {
    /** Quantity value to initialize/reset the local input from. */
    quantity: number;
    /** Called with the resolved number whenever the value changes or is committed. */
    onCommit: (q: number) => void;
    /** Called when the popover should close; passed the resolved value, or the snapshot on discard. */
    onClose: (finalValue?: number) => void;
};

/**
 * Numeric stepper for setting an item's quantity. Enter commits and closes;
 * Escape discards back to `quantity` and closes; blurring commits whatever
 * is currently typed.
 */
export const ShoppingListAddItemQuantity = ({ quantity, onCommit, onClose }: Props) => {
    const {
        localValue,
        handleChange,
        handleKeyDown,
        handleBlur
    } = useShoppingListAddItemQuantity({
        quantity,
        onCommit,
        onClose
    });

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
                onBlur={handleBlur}
                classNames={{
                    wrapper: "shopping-list-add-item-quantity-wrapper",
                    input: "shopping-list-add-item-quantity-input",
                    controls: "shopping-list-add-item-quantity-controls",
                }}
            />
        </div>
    );
};
