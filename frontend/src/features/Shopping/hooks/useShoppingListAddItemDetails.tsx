import { useState } from "react";
import type { ShoppingItemDetails, ShoppingItemDetailsHandlers } from "../types";

/**
 * Manages the quantity popover's local draft state. The value shown while
 * the popover is open is a snapshot taken at open time, kept separate from
 * the committed `details.quantity` so canceling the popover doesn't affect it.
 */
export const useShoppingListAddItemDetails = (
    details: ShoppingItemDetails,
    handlers: ShoppingItemDetailsHandlers
) => {
    // State
    const [qtySnapshot, setQtySnapshot] = useState(details.quantity);

    // Handlers
    /** Opens/closes the quantity popover, snapshotting or committing the draft quantity as needed. */
    const handleQtyOpenChange = (isOpen: boolean, explicitValue?: number) => {
        if (isOpen) {
            setQtySnapshot(details.quantity);
            handlers.setDraftQuantity(details.quantity);
        } else {
            handlers.setQuantity(explicitValue ?? details.draftQuantity);
        }
        handlers.setQtyOpened(isOpen);
    };

    const handleQtyClose = (finalValue?: number) => handleQtyOpenChange(false, finalValue);
    const handleUnitClose = (finalValue?: string) => handlers.setUnit(finalValue ?? "");
    const handleCategoryClose = (finalValue?: number | null) => handlers.setCategoryId(finalValue ?? null);

    return {
        qtySnapshot,
        handleQtyOpenChange,
        handleQtyClose,
        handleUnitClose,
        handleCategoryClose,
    };
};